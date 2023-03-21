import {
    Component,
    OnInit,
    ViewChild,
    AfterViewInit,
    ElementRef,
    TemplateRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { toString, cloneDeep } from 'lodash-es';

//#region rxjs
import { fromEvent, Subject } from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
} from 'rxjs/operators';
//#endregion

//#region components
import { FileChooserComponent } from '@shared/components/file-chooser/file-chooser.component';
import { SnackbarService } from '@shared/providers/snackbar.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
//#endregion

//#region models
import { CommentViewModel } from '@models/comment.model';
import { ProjectViewModel } from '@models/project.model';
import { FileUpload, PictureViewModel } from '@models/file.model';
import { User, UserViewModel } from '@models/user.model';
//#endregion

//#region Data access layer
import { CommentService } from '@data/comment.service';
import { ProjectService } from '@data/project.service';
import { UserService } from '@data/user.service';
import { FileUploadService } from '@data/file-upload.service';
//#endregion

import { multipleEmail } from '@shared/providers/multiple-email.validator';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Clipboard } from '@angular/cdk/clipboard';
import { generalUtil, projectUtil } from '@shared/utils/utils';

@Component({
    selector: 'app-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.scss'],
})
export class ProjectComponent implements OnInit, AfterViewInit {
    @ViewChild(FileChooserComponent, { static: true })
    public fileChooserComponent!: FileChooserComponent;
    @ViewChild('canvasDiv')
    canvasDiv!: ElementRef;
    @ViewChild('content')
    private content!: TemplateRef<any>;
    // @ViewChild('settings')
    // private settings!: TemplateRef<any>;
    @ViewChild('share')
    private share!: TemplateRef<any>;
    @ViewChild('guest')
    private guest!: TemplateRef<any>;

    showCommentSidebar = true;
    showImageSidebar = true;
    imgSidebarWidth = 140;
    commentSidebarWidth = 320;
    canvasAreaWidth = `calc(100vw - ${this.imgSidebarWidth}px - ${this.commentSidebarWidth}px)`;
    headerTextArea = `calc((100vw - ${this.imgSidebarWidth}px - ${this.commentSidebarWidth}px)/3)`;

    users: UserViewModel[] = [];
    currentUserKey = '';
    isChecked = true;
    projectKey = '';
    inviteKey = '';
    isInviteLink = false;
    projectData: any = {
        imgIndex: -1,
        selectedImg: null,
        deleteImg: null,
        uploads: null,
        commentsInProject: null,
        currentComments: null,
        pinCount: 0,
        project: null,
    };

    panelData: any = {
        files: null,
        inViewMode: false,
        isEdit: false,
        comment2edit: null,
        newComment: null,
    };

    editorData: any = {
        x: 0,
        y: 0,
        imageKey: '',
        projectKey: '',
        createdBy: '',
        content: null,
    };
    showEditor = false;
    showCreateEditor = false;
    sidebarDisplay = 'active';

    hMultipler = 0;
    wMultipler = 0;

    isLoading = false;

    public filesForm: UntypedFormGroup;

    public shareForm: UntypedFormGroup;
    shareSubmitted = false;
    shareError = false;
    shareChipsProps = {
        removable: true,
        selectable: true,
        addOnBlur: true,
        separatorKeysCodes: [ENTER, COMMA] as const,
    };

    public guestForm: UntypedFormGroup;
    isGuestSubmitted = false;
    hideRequiredControl = new UntypedFormControl(false);
    floatLabelControl = new UntypedFormControl('always');

    projectUsers: any = [];

    private uploadNameSubject: Subject<any> = new Subject();

    constructor(
        private readonly route: ActivatedRoute,
        private readonly uploadService: FileUploadService,
        private readonly commentService: CommentService,
        private readonly projectService: ProjectService,
        private readonly userService: UserService,
        private readonly formBuilder: UntypedFormBuilder,
        private readonly snackBar: SnackbarService,
        private readonly modalService: NgbModal,
        private readonly router: Router,
        private clipboard: Clipboard
    ) {
        if (this.router.url.indexOf('invite') > -1) {
            this.isInviteLink = true;
            this.inviteKey = toString(
                this.route.snapshot.paramMap.get('key')
            ).trim();
        } else {
            this.projectKey = toString(
                this.route.snapshot.paramMap.get('key')
            ).trim();
        }
        this.currentUserKey = generalUtil.getCurrentUserKey();
        this.retrieveProject();
        this.filesForm = this.formBuilder.group({
            uploadFiles: null,
        });
        this.shareForm = this.formBuilder.group(
            {
                link: [''],
                email: [[], [Validators.required]],
            },
            {
                validator: multipleEmail('email'),
            }
        );
        this.guestForm = this.formBuilder.group({
            name: [null, [Validators.required]],
        });
    }

    ngOnInit(): void {
        this.retrieveFiles();
        this.retrieveUsers();
        this.filesForm = this.formBuilder.group({
            uploadFiles: this.fileChooserComponent?.createFormGroup(),
        });
    }
    ngAfterViewInit(): void {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const open$ = fromEvent(this.canvasDiv.nativeElement, 'click')
            .pipe(
                filter(
                    (event: any) =>
                        this.canvasDiv.nativeElement === event['target']
                )
            )
            .subscribe((e: any) => {
                this.editorData.x = e.offsetX;
                this.editorData.y = e.offsetY;
                this.editorData.key = null;
                this.editorData.content = null;
                this.editorData.imageKey = this.projectData.selectedImg.key;
                this.editorData.projectKey = this.projectKey;
                this.editorData.actualX =
                    (e.offsetX / this.canvasDiv.nativeElement.width) *
                    this.projectData.selectedImg.width;
                this.editorData.actualY =
                    (e.offsetY / this.canvasDiv.nativeElement.height) *
                    this.projectData.selectedImg.height;
                this.editorData.pinCount = this.projectData.pinCount;
                if (this.currentUserKey === '') {
                    this.openGuest();
                } else {
                    this.showCreateEditor = true;
                }
            });
        this.retrieveComments();
        this.retrieveUsers();

        this.uploadNameSubject
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
                this.projectData.uploads[resp.index].isLoading = true;
                this.uploadService
                    .updateName(resp.key, resp.val)
                    .then(
                        () =>
                            (this.projectData.uploads[resp.index].isLoading =
                                false)
                    )
                    .catch(() => {
                        this.snackBar.snackbarError(
                            'Error while updating name!'
                        );
                    });
            });
    }

    //#region queries
    retrieveFiles(): void {
        this.uploadService
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
                this.projectData.uploads = data
                    .map((c) => new PictureViewModel().deserialize(c))
                    .filter(
                        (x) => x.projectKey === this.projectKey && x.isActive
                    );
                this.projectData.selectedImg = this.projectData.uploads[0];
                this.projectData.imgIndex = 0;

                this.panelData.files = data
                    .map((c, index) =>
                        cloneDeep({
                            ...new PictureViewModel().deserialize(c),
                            isCollapsed: index === 0 ? false : true,
                        })
                    )
                    .filter(
                        (x) => x.projectKey === this.projectKey && x.isActive
                    );

                this.retrieveComments();
            });
    }
    retrieveComments(): void {
        this.commentService
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
                const _commentsInProject = data
                    .map((c) => new CommentViewModel().deserialize(c))
                    .filter(
                        (x) =>
                            x.projectKey === this.projectKey && x.status !== 0
                    );

                this.projectData.commentsInProject = _commentsInProject.map(
                    (c) => {
                        const ab = new CommentViewModel().deserialize(c);
                        const img = this.projectData.uploads.filter(
                            (_img: any) => _img.key === ab.imageKey
                        )[0];
                        if (img) {
                            ab.pinX = ab.x / img.width;
                            ab.pinY = ab.y / img.height;
                        }
                        ab.children = _commentsInProject.filter(
                            (x) => x.status !== 0 && x.parentKey === ab.key
                        );
                        return ab;
                    }
                );

                this.projectData.currentComments =
                    this.projectData.commentsInProject.filter(
                        (o: any) =>
                            o.imageKey === this.projectData.selectedImg.key &&
                            o.status !== 0
                    );
                const parentCommentsOnly = cloneDeep(
                    this.projectData.commentsInProject
                ).filter((x: any) => toString(x.parentKey).trim() === '');
                this.projectData.pinCount = parentCommentsOnly.length;
                setTimeout(() => {
                    this.onResized();
                }, 100);

                this.panelData.files.map((file: any) => {
                    file.comments = [];
                    file.activeComments =
                        this.projectData.commentsInProject.filter(
                            (p: any) =>
                                p.imageKey === file.key && p.status === 1
                        );
                    file.resolvedComments =
                        this.projectData.commentsInProject.filter(
                            (p: any) =>
                                p.imageKey === file.key && p.status === 2
                        );
                });
                this.retrieveUsers();
            });
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
                const temp = data
                    .map((c) => new ProjectViewModel().deserialize(c))
                    .filter(
                        (x) =>
                            (x.key === this.projectKey ||
                                x.inviteLink === this.inviteKey) &&
                            x.isActive
                    )[0];
                if (temp) {
                    this.projectKey = temp.key;
                    if (this.isInviteLink) {
                        this.projectData.project = temp;
                        const updated =
                            projectUtil.makeUpdatedProjectInvite(temp);
                        this.projectService.updateShared(
                            temp.key,
                            updated.sharedUsers,
                            updated.allowedEmails
                        );
                    } else {
                        const allowProject = projectUtil.allowProject(temp);
                        if (
                            allowProject?.createdBy ||
                            allowProject?.sharedWithUser
                        ) {
                            this.projectData.project = temp;
                        } else if (allowProject?.sharedWithEmail) {
                            const updated = projectUtil.makeUpdatedProjectShare(
                                temp.sharedUsers,
                                temp.allowedEmails
                            );
                            this.projectService.updateShared(
                                temp.key,
                                updated.sharedUsers,
                                updated.allowedEmails
                            );
                            this.projectData.project = temp;
                        } else {
                            this.router.navigate(['/']);
                        }
                    }
                } else {
                    this.router.navigate(['/']);
                }
            });
    }
    retrieveUsers(): void {
        this.userService
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
                if (this.projectData.commentsInProject) {
                    this.projectData.commentsInProject =
                        this.projectData.commentsInProject.map((c: any) => {
                            if (c.children) {
                                c.children.map((child: any) => {
                                    const childUser = this.users.filter(
                                        (u) =>
                                            u.userKey === child.createdBy ||
                                            u.key === child.createdBy
                                    )[0];
                                    const childDisplayName =
                                        childUser.username ||
                                        childUser.fullName;
                                    child.displayName =
                                        toString(childDisplayName).trim();
                                    child.isEdit = false;
                                    return child;
                                });
                            }
                            const user = this.users.filter(
                                (u) =>
                                    u.userKey === c.createdBy ||
                                    u.key === c.createdBy
                            )[0];
                            const displayName = user.username || user.fullName;
                            const temp = {
                                ...cloneDeep(c),
                                displayName: toString(displayName).trim(),
                            };
                            return temp;
                        });
                }
                if (this.panelData.comment2edit) {
                    const _user = this.users.filter(
                        (u) =>
                            u.userKey ===
                                this.panelData.comment2edit.createdBy ||
                            u.key === this.panelData.comment2edit.createdBy
                    )[0];
                    const _displayName = _user.username || _user.fullName;
                    this.panelData.comment2edit.displayName =
                        toString(_displayName).trim();
                }
                if (this.panelData.files) {
                    this.panelData.files.map((file: any) => {
                        if (file.activeComments) {
                            file.activeComments = file.activeComments.map(
                                (ac: any) => {
                                    const user = this.users.filter(
                                        (u) =>
                                            u.userKey === ac.createdBy ||
                                            u.key === ac.createdBy
                                    )[0];
                                    const displayName =
                                        user.username || user.fullName;
                                    const temp = {
                                        ...cloneDeep(ac),
                                        displayName:
                                            toString(displayName).trim(),
                                    };
                                    return temp;
                                }
                            );
                        }
                        if (file.resolvedComments) {
                            file.resolvedComments = file.resolvedComments.map(
                                (rs: any) => {
                                    const user = this.users.filter(
                                        (u) =>
                                            u.userKey === rs.createdBy ||
                                            u.key === rs.createdBy
                                    )[0];
                                    const displayName =
                                        user.username || user.fullName;
                                    const temp = {
                                        ...cloneDeep(rs),
                                        displayName:
                                            toString(displayName).trim(),
                                    };
                                    return temp;
                                }
                            );
                        }
                    });
                }
                if (this.panelData.comment2edit) {
                    const updatedComment =
                        this.projectData.commentsInProject.filter(
                            (x: any) =>
                                x.key === this.panelData.comment2edit.key
                        );
                    this.panelData.comment2edit = updatedComment[0];
                }
                if (this.projectData?.project) {
                    this.projectUsers = (
                        this.projectData?.project.sharedUsers || []
                    ).map((user: any) => {
                        const info = this.users.filter((u) => {
                            return u.userKey === user;
                        });
                        return info
                            ? info[0]
                                ? info[0].fullName
                                : null
                            : null;
                    });
                }
            });
    }
    //#endregion

    //#region image sidebar
    changeImg(picture: any, index: number) {
        this.projectData.selectedImg = picture;
        this.projectData.imgIndex = index;
        this.projectData.currentComments =
            this.projectData.commentsInProject.filter(
                (x: any) => x.imageKey === picture.key && x.status !== 0
            );
        setTimeout(() => {
            this.onResized();
        }, 100);
    }
    nextImg(): void {
        if (this.projectData.imgIndex < this.projectData.uploads.length - 1) {
            this.projectData.imgIndex += 1;
            this.projectData.selectedImg =
                this.projectData.uploads[this.projectData.imgIndex];
            this.projectData.currentComments =
                this.projectData.commentsInProject.filter(
                    (x: any) =>
                        x.imageKey === this.projectData.selectedImg.key &&
                        x.status !== 0
                );
            setTimeout(() => {
                this.onResized();
            }, 100);
        }
    }
    prevImg(): void {
        if (this.projectData.imgIndex > 0) {
            this.projectData.imgIndex -= 1;
            this.projectData.selectedImg =
                this.projectData.uploads[this.projectData.imgIndex];
            this.projectData.currentComments =
                this.projectData.commentsInProject.filter(
                    (x: any) =>
                        x.imageKey === this.projectData.selectedImg.key &&
                        x.status !== 0
                );
            setTimeout(() => {
                this.onResized();
            }, 100);
        }
    }
    onEditableKeyup(evt: any, key: string, index: number) {
        const keycode = evt.charCode || evt.keyCode;
        if (+keycode === 13) {
            evt.preventDefault();
            document.getElementById(key)?.blur();
            const val = document.getElementById(key)?.innerText;
            this.uploadNameSubject.next({ key, val, index });
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
        this.uploadNameSubject.next({ key, val, index });
        return true;
    }
    confirmDeleteImg(picture: any): void {
        this.projectData.deleteImg = picture;
        this.modalService.open(this.content, {
            centered: true,
            backdropClass: 'share-backdrop',
        });
    }
    deleteImg(): void {
        this.projectData.commentsInProject
            .filter((x: any) => x.imageKey === this.projectData.deleteImg.key)
            .map((y: any) => {
                this.commentService.changeStatus(y.key, 0);
                this.projectService.updateCommentCount(this.projectKey, -1);
            });
        this.uploadService
            .changeStatus(this.projectData.deleteImg.key, false)
            .then(() => {
                this.projectService.updateUploadCount(this.projectKey, -1);
                this.closeConfirmModal();
            })
            .catch(() => {
                this.snackBar.snackbarError('Could not delete. Try again!');
            });
    }
    closeConfirmModal() {
        this.modalService.dismissAll(this.content);
    }
    replaceImg(event: any, picture: any): void {
        const newFiles = event.target.files;
        if (newFiles.length === 0) {
            return;
        }

        let validFile: any = null;
        const mimeType = newFiles[0].type;
        if (mimeType.match(/image\/*/) == null) {
            this.snackBar.snackbarWarning('Only images are supported!');
        } else {
            validFile = newFiles[0];
        }

        const img = new Image();
        img.src = URL.createObjectURL(validFile);
        img.onload = (e: any) => {
            const height =
                e.currentTarget.naturalHeight || e.currentTarget.height;
            const width = e.currentTarget.naturalWidth || e.currentTarget.width;
            const fileData = {
                height,
                width,
                size: validFile.size,
                extension: validFile.name.split('.')[1],
            };
            const file2upload = { done: -1, fileData, file: validFile };

            if (file2upload.file) {
                const fileUpload = new FileUpload(file2upload.file);
                const data = {
                    projectKey: this.projectKey,
                    ...file2upload.fileData,
                    isActive: false,
                };
                const replaceObj = {
                    isReplace: true,
                    replaceKey: picture.key,
                    comments2replace: cloneDeep(
                        this.projectData.commentsInProject.filter(
                            (x: any) => x.imageKey === picture.key
                        )
                    ),
                    oldImg: picture,
                };
                this.uploadService
                    .pushFileToStorage(fileUpload, data, replaceObj)
                    .subscribe(
                        (percentage) => {
                            file2upload.done = Math.round(
                                percentage ? percentage : 0
                            );
                        },
                        () => {
                            this.snackBar.snackbarError(
                                'Error while uploading file.'
                            );
                        }
                    );
            }
        };
    }
    //#endregion

    //#region comment sidebar
    toggle(val: string): void {
        this.sidebarDisplay = val;
        this.goBack();
    }
    toggleComments(): void {
        this.showCommentSidebar = !this.showCommentSidebar;
        this.calculateWidth();
    }
    calculateWidth(): void {
        this.canvasAreaWidth = `calc(100vw - ${
            this.showImageSidebar ? this.imgSidebarWidth : 0
        }px - ${this.showCommentSidebar ? this.commentSidebarWidth : 0}px)`;
        this.headerTextArea = `calc((100vw - ${
            this.showImageSidebar ? this.imgSidebarWidth : 0
        }px - ${this.showCommentSidebar ? this.commentSidebarWidth : 0}px)/3)`;
        // if (this.showCommentSidebar) {
        //   this.canvasAreaWidth = `calc(100vw - ${this.imgSidebarWidth}px - ${this.commentSidebarWidth}px)`;
        // } else {
        //   this.canvasAreaWidth = `calc(100vw - ${this.imgSidebarWidth}px)`;
        // }
    }
    onClose(event: any): void {
        this.showEditor = event;
        this.showCreateEditor = event;
    }
    changeCollapsible(i: number): void {
        this.panelData.files[i].isCollapsed =
            !this.panelData.files[i].isCollapsed;
    }
    resolveComment(comment: any): void {
        const key = toString(comment.key).trim();
        if (comment && key !== '') {
            // updating new tags for comment, parent comment & project
            const newTags = projectUtil.createNewTag(
                this.projectData.project.sharedUsers,
                this.projectData.project.createdBy
            );
            const parentKey = toString(comment.parentKey).trim();
            if (parentKey !== '') {
                this.commentService.updateNewTags(parentKey, newTags);
            }
            this.commentService.updateNewTags(key, newTags);
            this.projectService.updateNewTags(
                this.projectData.project.key,
                newTags
            );

            // resolve comment
            this.commentService.changeStatus(key, 2);
            this.goBack();
        }
    }
    unresolveComment(comment: any): void {
        const key = toString(comment.key).trim();
        if (comment && key !== '') {
            // updating new tags for comment, parent comment & project
            const newTags = projectUtil.createNewTag(
                this.projectData.project.sharedUsers,
                this.projectData.project.createdBy
            );
            const parentKey = toString(comment.parentKey).trim();
            if (parentKey !== '') {
                this.commentService.updateNewTags(parentKey, newTags);
            }
            this.commentService.updateNewTags(key, newTags);
            this.projectService.updateNewTags(
                this.projectData.project.key,
                newTags
            );

            // unresolve comment
            this.commentService.changeStatus(key, 1);
            this.goBack();
        }
    }
    viewComment(comment: any) {
        if (comment) {
            this.panelData.inViewMode = true;
            this.panelData.isEdit = false;
            this.panelData.comment2edit = comment;
            this.panelData.newComment = {
                imageKey: '',
                projectKey: this.projectKey,
                parentKey: comment.key,
                content: null,
            };

            // remove new tag for comment & child comment
            const updatedTags = projectUtil.updateNewTag(comment.newTags);
            this.commentService.updateNewTags(comment.key, updatedTags);
            this.panelData?.comment2edit?.children?.forEach((child: any) => {
                const tags = projectUtil.updateNewTag(child.newTags);
                this.commentService.updateNewTags(child.key, tags);
            });
        } else {
            this.snackBar.snackbarWarning('Try again!');
        }
    }
    openEditComment(): void {
        this.panelData.isEdit = true;
    }
    openEditChildComment(child2edit: any): void {
        child2edit.isEdit = true;
    }
    closeEditComment(event: any): void {
        this.panelData.isEdit = event.close;
        if (event.content) {
            this.panelData.comment2edit.content = event.content;
        }
    }
    closeEditChildComment(event: any, child2edit: any): void {
        child2edit.isEdit = event.close;
        if (event.content) {
            child2edit.content = event.content;
        }
    }
    // clearNewComment(event: any): void {
    // }
    confirmDelete(comment: any) {
        comment.confirmDelete = true;
    }
    deleteComment(comment: any, isChildComment: boolean = false) {
        if (comment && toString(comment.key).trim() !== '') {
            this.commentService.changeStatus(comment.key, 0).then(() => {
                comment.confirmDelete = false;
                if (!isChildComment) {
                    this.goBack();
                }
            });
            if (!isChildComment) {
                this.projectService.updateCommentCount(this.projectKey, -1);
            }
        }
    }
    closeDelete(comment: any) {
        comment.confirmDelete = false;
    }
    goBack(): void {
        this.panelData.comment2edit = null;
        this.panelData.isEdit = false;
        this.panelData.inViewMode = false;
    }
    onPinClick(e: any, comment: any): void {
        e.stopPropagation();
        let pic = null;
        let index = -1;
        this.projectData.uploads.map((x: any, i: number) => {
            if (x.key === comment.imageKey) {
                pic = x;
                index = i;
            }
        });
        this.changeImg(pic, index);
        // return false;
    }
    checkNewTag(comment: any): boolean {
        return projectUtil.showNewTag(comment.newTags);
    }
    //#endregion

    //#region canvas area
    onResized(): void {
        this.hMultipler = this.canvasDiv.nativeElement.height;
        this.wMultipler = this.canvasDiv.nativeElement.width;
    }
    openPin(pin: any): void {
        if (+pin.status === 1) {
            this.editorData.x = pin.pinX * this.wMultipler;
            this.editorData.y = pin.pinY * this.hMultipler;
            this.editorData.key = pin.key;
            this.editorData.content = pin.content;
            this.editorData.imageKey = pin.imageKey;
            this.editorData.projectKey = pin.projectKey || this.projectKey;
            this.editorData.createdBy = pin.createdBy;
            this.showEditor = true;
        }
    }
    //#endregion

    //#region bottom area
    toggleImages(): void {
        this.showImageSidebar = !this.showImageSidebar;
        this.calculateWidth();
    }
    // settingsChange(name: string): void {
    //   this.projectData.project.sendEmail = !this.projectData.project.sendEmail;
    // }
    closeShare(): void {
        this.modalService.dismissAll(this.share);
    }
    openShare(): void {
        this.shareSubmitted = false;

        const link = projectUtil.getShareLink(
            this.projectData?.project?.inviteLink
        );
        this.projectService.updateInviteLink(
            this.projectData?.project?.key,
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
        const key = this.projectData.project.key;
        const sharedUsers = this.projectData.project.sharedUsers;
        const allowedEmails = this.projectData.project.allowedEmails;
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
    // openSetting(): void {
    //   this.modalService
    //     .open(this.settings, {
    //       size: 'sm',
    //       backdropClass: 'transparent-backdrop',
    //       windowClass: 'settings-modal',
    //     })
    //     .result.then(
    //       (result) => {},
    //       (reason) => {
    //         const obj2update = _.pick(this.projectData.project, ['sendEmail']);
    //         this.projectService.updateSettings(
    //           this.projectData.project.key,
    //           obj2update
    //         );
    //       }
    //     );
    // }
    get _shareForm(): any {
        return this.shareForm.controls;
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
    }
    //#endregion

    //#region guest login
    get _guestForm(): any {
        return this.guestForm.controls;
    }
    closeGuest(): void {
        this.modalService.dismissAll(this.guest);
    }
    openGuest(): void {
        this.isGuestSubmitted = false;
        this.guestForm.setValue({
            name: null,
        });
        this.modalService.open(this.guest, {
            size: 'md',
            centered: true,
            backdropClass: 'share-backdrop',
        });
    }
    continueGuest(): void {
        this.isGuestSubmitted = true;
        if (this.guestForm.invalid) {
            return;
        }
        const guest = new User();
        guest.fullName = this.guestForm.value.name;
        return this.userService.create(guest).then((res: any) => {
            this.currentUserKey = res.key;
            generalUtil.setCurrentUserKey(res.key);
            this.closeGuest();
        });
    }
    moveToAuth(page = 'signin'): void {
        this.closeGuest();
        this.router.navigate([`/auth/${page}`]);
    }
    //#endregion
}
