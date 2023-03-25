import {
    Component,
    OnInit,
    AfterViewInit,
    ViewChild,
    TemplateRef,
    OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { PictureViewModel } from '@models/file.model';
import { ProjectViewModel } from '@models/project.model';
import { FileUploadService } from '@data/file-upload.service';
import { ProjectService } from '@data/project.service';
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
} from 'rxjs/operators';
import { toString, cloneDeep } from 'lodash-es';
import { Subject } from 'rxjs';
import { SnackbarService } from '@shared/providers/snackbar.service';
import { projectUtil } from '@shared/utils/utils';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { multipleEmail } from '@shared/providers/multiple-email.validator';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Clipboard } from '@angular/cdk/clipboard';
import { UserService } from '@data/user.service';
import { UserViewModel } from '@models/user.model';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('deleteProjectModal')
    private deleteProjectModal!: TemplateRef<any>;
    @ViewChild('share')
    private share!: TemplateRef<any>;

    projects: ProjectViewModel[] = [];
    uploads: PictureViewModel[] = [];
    live = true;
    project2delete: any = null;
    project2share: any = null;

    isOpened = false;

    public shareForm: UntypedFormGroup;
    shareSubmitted = false;
    shareError = false;
    copyText = 'Copy';
    shareChipsProps = {
        removable: true,
        selectable: true,
        addOnBlur: true,
        separatorKeysCodes: [ENTER, COMMA] as const,
    };
    users: UserViewModel[] = [];

    isLoading = false;

    private projectNameSubject: Subject<any> = new Subject();
    private projects$: any;
    private users$: any;
    private uploads$: any;

    constructor(
        private readonly projectService: ProjectService,
        private readonly router: Router,
        private readonly uploadService: FileUploadService,
        private readonly snackBar: SnackbarService,
        private readonly modalService: NgbModal,
        private readonly formBuilder: UntypedFormBuilder,
        private readonly userService: UserService,
        private clipboard: Clipboard
    ) {
        this.shareForm = this.formBuilder.group(
            {
                link: [''],
                email: [[], [Validators.required]],
            },
            {
                validator: multipleEmail('email'),
            }
        );
    }
    ngOnInit(): void {
        this.retrieveProjects();
        this.retrieveUsers();
    }
    ngAfterViewInit(): void {
        this.projectNameSubject
            .pipe(
                map((x) => ({
                    key: toString(x.key).trim(),
                    val: toString(x.val)
                        .trim()
                        .replace(/\r?\n|\r/g, ''),
                    index: x.index,
                })),
                filter((y) => y.key !== '' && y.val !== ''),
                debounceTime(600),
                distinctUntilChanged()
            )
            .subscribe((resp) => {
                this.projects[resp.index].isLoading = true;
                this.projectService
                    .updateName(resp.key, resp.val)
                    .then(() => (this.projects[resp.index].isLoading = false))
                    .catch(() => {
                        this.snackBar.snackbarError(
                            'Unable to update project name!'
                        );
                    });
            });
    }
    ngOnDestroy(): void {
        this.projectNameSubject.unsubscribe();
        this.projects$.unsubscribe();
        this.users$.unsubscribe();
        this.uploads$.unsubscribe();
    }
    retrieveProjects(): void {
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
                this.projects = data
                    .map((c) => new ProjectViewModel().deserialize(c))
                    .filter((x) => {
                        const allowProject = projectUtil.allowProject(x);
                        if (
                            allowProject?.createdBy ||
                            allowProject?.sharedWithUser
                        ) {
                            return true;
                        } else if (allowProject?.sharedWithEmail) {
                            const updated = projectUtil.makeUpdatedProjectShare(
                                x.sharedUsers,
                                x.allowedEmails
                            );
                            this.projectService.updateShared(
                                x.key,
                                updated.sharedUsers,
                                updated.allowedEmails
                            );
                            return true;
                        }
                        return false;
                    });
                this.retrieveFiles();
            });
    }
    retrieveFiles(): void {
        this.uploads$ = this.uploadService
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
                this.uploads = data.map((c) =>
                    new PictureViewModel().deserialize(c)
                );
                this.projects.map((proj) => {
                    const pictures = this.uploads.filter(
                        (up) =>
                            up.projectKey === proj.key &&
                            proj.isActive &&
                            up.isActive
                    );
                    if (pictures.length > 0) {
                        proj.thumbnail = pictures[0];
                    }
                });
            });
    }
    retrieveUsers(): void {
        this.users$ = this.userService
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
                this.users = data.map((c) =>
                    new UserViewModel().deserialize(c)
                );
            });
    }
    openMarkup(project: any): void {
        if (project && toString(project.key).trim() !== '') {
            void this.router.navigate(['/project', project.key]);

            // remove new tag for project
            const updatedTags = projectUtil.updateNewTag(project.newTags);
            this.projectService.updateNewTags(project.key, updatedTags);
        } else {
            this.snackBar.snackbarWarning("Can't find project. Try again!");
        }
    }
    onEditableKeyup(evt: any, key: string, index: number) {
        const keycode = evt.charCode || evt.keyCode;
        if (+keycode === 13) {
            evt.preventDefault();
            document.getElementById(key)?.blur();
            const val = document.getElementById(key)?.innerText;
            this.projectNameSubject.next({ key, val, index });
            return false;
        }
        return true;
    }
    onEditableBlur(evt: any, key: string, index: number) {
        const keycode = evt.charCode || evt.keyCode;
        if (+keycode === 13) {
            evt.preventDefault();
            document.getElementById(key)?.blur();
            return false;
        }
        const val = document.getElementById(key)?.innerText;
        this.projectNameSubject.next({ key, val, index });
        return true;
    }
    checkNewTag(project: any): boolean {
        return projectUtil.showNewTag(project.newTags);
    }
    confirmDeleteProject(project: any) {
        this.project2delete = project;
        this.modalService.open(this.deleteProjectModal, {
            centered: true,
            backdropClass: 'share-backdrop',
        });
    }
    closeConfirmModal() {
        this.modalService.dismissAll(this.deleteProjectModal);
    }
    deleteProject(): void {
        this.projectService
            .changeStatus(this.project2delete.key, false)
            .then(() => {
                this.closeConfirmModal();
            })
            .catch(() => {
                this.snackBar.snackbarError('Could not delete. Try again!');
            });
    }

    //#region share
    get _shareForm(): any {
        return this.shareForm.controls;
    }
    closeShare(): void {
        this.modalService.dismissAll(this.share);
    }
    openShare(project: any): void {
        this.shareSubmitted = false;
        this.project2share = project;
        const link = projectUtil.getShareLink(this.project2share?.inviteLink);
        this.projectService.updateInviteLink(
            this.project2share?.key,
            link?.key
        );
        this.shareForm.setValue({
            ...this.shareForm.value,
            email: [],
            link: link?.url,
        });
        this.modalService.open(this.share, {
            size: 'lg',
            centered: true,
            backdropClass: 'share-backdrop',
        });
    }
    handleShare(): void {
        this.shareSubmitted = true;
        if (this.shareForm.invalid) {
            return;
        }
        this.isLoading = true;
        const key = this.project2share.key;
        const sharedUsers = this.project2share.sharedUsers;
        const allowedEmails = this.project2share.allowedEmails;
        const users = cloneDeep(this.shareForm.value.email);
        const userKeys: string[] = [];
        const userEmails: string[] = [];
        users.forEach((u: string) => {
            const x = this.users.find(
                (us) => toString(us.email).trim() === toString(u).trim()
            );
            if (x) {
                if (toString(x?.userKey).trim() !== '') {
                    userKeys.push(toString(x?.userKey).trim());
                }
            } else {
                userEmails.push(u);
            }
        });
        const final = sharedUsers.concat(userKeys);
        const finalEmails = allowedEmails.concat(userEmails);
        this.projectService
            .updateShared(key, final, finalEmails)
            .then(() => {
                this.shareForm.setValue({
                    ...this.shareForm.value,
                    email: [],
                });
                this.isLoading = false;
                this.shareSubmitted = false;
            })
            .catch(() => {
                this.isLoading = false;
                this.shareSubmitted = false;
                this.shareError = true;
                setTimeout(() => (this.shareError = false), 3000);
            });
    }
    addEmail(event: any) {
        if (event.value) {
            const updated = this.shareForm.value.email;
            updated.push(event.value.trim());
            this.shareForm.setValue({
                ...this.shareForm.value,
                email: updated,
            });
            event.input.value = '';
        }
    }
    removeEmail(index: number) {
        const final = this.shareForm.value.email;
        if (index >= 0) {
            final.splice(index, 1);
            this.shareForm.setValue({
                ...this.shareForm.value,
                email: final,
            });
        }
    }
    copyLink(): void {
        this.clipboard.copy(this.shareForm.value.link);
        this.copyText = 'Copied';
        setTimeout(() => (this.copyText = 'Copy'), 6000);
    }
    //#endregion
}
