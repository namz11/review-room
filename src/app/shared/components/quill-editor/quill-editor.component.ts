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
import { Comment } from '@models/comment.model';
import { v4 as uuidv4 } from 'uuid';
import { ProjectService } from '@data/project.service';
import { toString } from 'lodash-es';
import { SnackbarService } from '@shared/providers/snackbar.service';
import { generalUtil, projectUtil } from '@shared/utils/utils';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectViewModel } from '@models/project.model';
import { map } from 'rxjs/operators';

declare const setQuillEditor: any;
declare const getQuillContent: any;

@Component({
    selector: 'app-quill-editor',
    templateUrl: './quill-editor.component.html',
    styleUrls: ['./quill-editor.component.scss'],
})
export class QuillEditorComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() data: any = {
        imageKey: '',
        projectKey: '',
        createdBy: '',
        content: null,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        actualX: 0,
        actualY: 0,
    };
    @Output()
    selectionChanged = new EventEmitter<any>();

    id: string;
    isNew = true;
    currentUserKey = '';
    project: ProjectViewModel = new ProjectViewModel();

    private projects$: any;

    constructor(
        private readonly commentService: CommentService,
        private readonly snackBar: SnackbarService,
        private readonly projectService: ProjectService,
        private readonly modalService: NgbModal
    ) {
        this.id = `quill-editor-${uuidv4()}`;
        this.currentUserKey = generalUtil.getCurrentUserKey();
    }

    ngOnInit(): void {
        this.data.top = this.data.y + 30;
        this.data.left = this.data.x - 150 < 0 ? 0 : this.data.x - 150;
        this.isNew = toString(this.data.key).trim() !== '' ? false : true;
        this.retrieveProject();
    }

    ngOnDestroy(): void {
        this.id = '';
        this.projects$.unsubscribe();
    }

    retrieveProject(): void {
        this.projects$ = this.projectService
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

    ngAfterViewInit(): void {
        setQuillEditor(this.id, this.data.content);
    }

    setQuill(data: any): void {
        this.data = data;
        setQuillEditor(this.id, data);
    }

    createPin() {
        const content = getQuillContent(this.id);
        const comment = new Comment().deserialize(this.data);
        comment.content = content;
        comment.x = this.data.actualX;
        comment.y = this.data.actualY;
        comment.index = this.data.pinCount + 1;
        comment.status = 1;
        this.commentService
            .create(comment)
            .then((res: any) => {
                this.cancelPin();

                // updating new tags for comment, parent comment & project
                const newTags = projectUtil.createNewTag(
                    this.project.sharedUsers,
                    this.project.createdBy
                );
                if (comment.parentKey !== '') {
                    this.commentService.updateNewTags(
                        comment.parentKey,
                        newTags
                    );
                }
                this.commentService.updateNewTags(res.key, newTags);
                this.projectService.updateNewTags(this.project.key, newTags);
            })
            .catch(() => {
                this.snackBar.snackbarError('Unable to save comment');
            });
        this.projectService.updateCommentCount(comment.projectKey, 1);
    }

    savePin() {
        const content = getQuillContent(this.id);
        const key = toString(this.data.key).trim();
        this.commentService
            .updateContent(key, content)
            .then(() => {
                this.cancelPin();
            })
            .catch(() => {
                this.snackBar.snackbarError('Unable to save comment');
            });
        // updating new tags for comment, parent comment & project
        const newTags = projectUtil.createNewTag(
            this.project.sharedUsers,
            this.project.createdBy
        );
        if (toString(this.data.parentKey).trim() !== '') {
            this.commentService.updateNewTags(
                toString(this.data.parentKey).trim(),
                newTags
            );
        }
        this.commentService.updateNewTags(key, newTags);
        this.projectService.updateNewTags(this.project.key, newTags);
    }

    cancelPin() {
        this.ngOnDestroy();
        this.selectionChanged.emit(false);
    }
}
