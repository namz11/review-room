import {
    AfterViewInit,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
} from '@angular/core';
import { CommentService } from '@data/comment.service';
import { v4 as uuidv4 } from 'uuid';
import { ProjectService } from '@data/project.service';
import { toString } from 'lodash-es';
import { SnackbarService } from '@shared/providers/snackbar.service';
import { Comment } from '@models/comment.model';
import { ProjectViewModel } from '@models/project.model';
import { map } from 'rxjs/operators';
import { projectUtil } from '@shared/utils/utils';

declare const setQuillEditor: any;
declare const getQuillContent: any;
declare const clearQuillContent: any;

@Component({
    selector: 'app-editor',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() data: any = {
        imageKey: '',
        projectKey: '',
        parentKey: '',
        content: null,
    };
    @Input() className = '';
    @Input() showCancel = true;
    @Output()
    selectionChanged = new EventEmitter<any>();

    id: string;
    project: ProjectViewModel = new ProjectViewModel();
    // isNew = true;

    constructor(
        private readonly commentService: CommentService,
        private readonly snackBar: SnackbarService,
        private readonly projectService: ProjectService
    ) {
        this.id = `quill-editor-${uuidv4()}`;
        this.className = 'editor-container';
    }

    ngOnInit(): void {
        this.retrieveProject();
        // this.isNew = toString(this.daa.key).trim() !== '' ? false : true;
    }

    ngOnDestroy(): void {
        this.id = '';
    }

    ngAfterViewInit(): void {
        setQuillEditor(this.id, this.data.content);
    }

    retrieveProject(): void {
        this.projectService
            .getAll()
            .snapshotChanges()
            .pipe(
                map((changes) =>
                    changes.map((c) => ({
                        key: c.payload.key,
                        ...c.payload.val(),
                    }))
                )
            )
            .subscribe((data) => {
                this.project = data
                    .map((c) => new ProjectViewModel().deserialize(c))
                    .filter(
                        (x) => x.key === this.data.projectKey && x.isActive
                    )[0];
            });
    }

    setQuill(data: any): void {
        this.data = data;
        setQuillEditor(this.id, data);
    }

    savePin() {
        if (toString(this.data.key).trim() !== '') {
            this.updatePin();
        } else {
            this.createPin();
        }
    }

    updatePin() {
        const content = getQuillContent(this.id);
        const key = toString(this.data.key).trim();
        this.commentService
            .updateContent(key, content)
            .then((res: any) => {
                this.cancelPin(content);
            })
            .catch((err: any) => {
                console.log(err);
                this.snackBar.snackbarError('Unable to save!');
            });
        // updating new tags for comment, parent comment & project
        const newTags = projectUtil.createNewTag(
            this.project.sharedUsers,
            this.project.createdBy
        );
        if (this.data.parentKey !== '') {
            this.commentService.updateNewTags(this.data.parentKey, newTags);
        }
        this.commentService.updateNewTags(key, newTags);
        this.projectService.updateNewTags(this.project.key, newTags);
    }

    createPin() {
        const content = getQuillContent(this.id);
        const comment = new Comment().deserialize(this.data);
        comment.content = content;
        comment.status = 1;
        this.commentService.create(comment).then((res: any) => {
            // don't call ngOnDestroy as we want to keep id but only clear the content
            // this.cancelPin();
            clearQuillContent(this.id);
            this.selectionChanged.emit({ close: false });

            // updating new tags for comment, parent comment & project
            const newTags = projectUtil.createNewTag(
                this.project.sharedUsers,
                this.project.createdBy
            );
            if (comment.parentKey !== '') {
                this.commentService.updateNewTags(comment.parentKey, newTags);
            }
            this.commentService.updateNewTags(res.key, newTags);
            this.projectService.updateNewTags(this.project.key, newTags);
        });

        // not updating count because it is child comment
        // this.projectService.updateCommentCount(comment.projectKey, 1);
    }

    cancelPin(content: any = null) {
        this.ngOnDestroy();
        this.selectionChanged.emit({ close: false, content });
    }
}
