import {
    Component,
    Input,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { SnackbarService } from '@shared/providers/snackbar.service';
import { NgbModalConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FileUploadService } from '@data/file-upload.service';
import { FileUpload, Picture, PictureViewModel } from '@models/file.model';
import { toString, toNumber, cloneDeep, isBoolean } from 'lodash-es';
import { Project } from '@models/project.model';
import { ProjectService } from '@data/project.service';
import { Router } from '@angular/router';
import { finalize, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import * as firebase from 'firebase/compat/app';
import {
    AngularFireDatabase,
    AngularFireList,
} from '@angular/fire/compat/database';

@Component({
    selector: 'app-file-chooser',
    templateUrl: './file-chooser.component.html',
    styleUrls: ['./file-chooser.component.scss'],
})
export class FileChooserComponent implements OnInit, OnDestroy {
    @Input() projectKey = '';
    @Input() showFooter = true;
    @Input() addAsActive = true;
    @Input()
    labelTemplateRef!: TemplateRef<any>;
    @ViewChild('content')
    private content!: TemplateRef<any>;

    id: string;
    public filesForm: UntypedFormGroup;

    allUploads: PictureViewModel[] = [];
    uploads: any[] = [];
    uploadKeys: any[] = [];
    removeUploads: string[] = [];
    currentFileUpload?: FileUpload;
    confirmDelete = false;
    isNewProject = false;

    fileUploadDone = false;

    uploadsRef: AngularFireList<Picture>;
    private basePath = '/uploads';

    private uploads$: any;

    constructor(
        private readonly formBuilder: UntypedFormBuilder,
        private readonly snackBar: SnackbarService,
        private readonly modalService: NgbModal,
        private readonly uploadService: FileUploadService,
        private readonly projectService: ProjectService,
        private readonly router: Router,
        config: NgbModalConfig,
        private db: AngularFireDatabase,
        private storage: AngularFireStorage
    ) {
        this.uploadsRef = db.list(this.basePath);

        this.id = uuidv4();
        this.filesForm = this.formBuilder.group({
            files: [null],
        });

        // customize default values of modals used by this component tree
        config.backdrop = true;
        config.keyboard = false;
    }
    ngOnInit(): void {
        this.retrieveFiles();
        this.filesForm.valueChanges.subscribe(() => {
            this.myModal();
        });
    }
    ngOnDestroy(): void {
        this.uploads$.unsubscribe();
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
                this.allUploads = data.map((c) =>
                    new PictureViewModel().deserialize(c)
                );
            });
    }
    public createFormGroup(): UntypedFormGroup {
        return this.filesForm;
    }
    onFileChanged(event: any) {
        this.confirmDelete = false;
        this.isNewProject = false;
        this.fileUploadDone = false;
        const newFiles = event.target.files;
        if (newFiles.length === 0) {
            return;
        }

        const validFiles: any[] = [];
        let isNonImg = false;
        [...newFiles].forEach((file: any) => {
            const mimeType = newFiles[0].type;
            if (mimeType.match(/image\/*/) == null) {
                isNonImg = true;
            } else {
                validFiles.push(file);
            }
        });
        if (isNonImg) {
            this.snackBar.snackbarWarning('Only images are supported!');
        }

        this.filesForm.patchValue({
            files: validFiles,
        });
        this.filesForm.get('files')?.updateValueAndValidity();
        this.uploads = [];
        const URL = window.URL || window.webkitURL;

        if (this.projectKey === '') {
            this.createProject().then(() => {
                validFiles.map((x) => {
                    const img = new Image();
                    img.src = URL.createObjectURL(x);
                    img.onload = (e: any) => {
                        const height =
                            e.currentTarget.naturalHeight ||
                            e.currentTarget.height;
                        const width =
                            e.currentTarget.naturalWidth ||
                            e.currentTarget.width;
                        const fileData = {
                            height,
                            width,
                            size: x.size,
                            extension: x.name.split('.')[1],
                        };
                        this.uploads.push({
                            done: -1,
                            fileProcessed: false,
                            fileData,
                            file: x,
                        });
                        // this.singleBeforeUpload(this.uploads[this.uploads.length - 1]);
                        this.singleUpload(
                            this.uploads[this.uploads.length - 1]
                        );
                    };
                });
            });
        } else {
            this.uploadKeys = [];
            validFiles.map((x) => {
                const img = new Image();
                img.src = URL.createObjectURL(x);
                img.onload = (e: any) => {
                    const height =
                        e.currentTarget.naturalHeight || e.currentTarget.height;
                    const width =
                        e.currentTarget.naturalWidth || e.currentTarget.width;
                    const fileData = {
                        height,
                        width,
                        size: x.size,
                        extension: x.name.split('.')[1],
                    };
                    this.uploads.push({
                        done: -1,
                        fileProcessed: false,
                        fileData,
                        file: x,
                    });
                    this.singleUpload(this.uploads[this.uploads.length - 1]);
                };
            });
        }
    }
    createProject(): Promise<void> {
        this.isNewProject = true;
        const project = new Project().deserialize({ name: 'New Project' });
        return this.projectService
            .create(project)
            .then((res: any) => {
                this.projectKey = res.key;
            })
            .catch(() => {
                this.snackBar.snackbarError('Error while creating project.');
            });
    }
    beforeUpload(): void {
        if (this.projectKey === '') {
            this.createProject().then(() => {
                this.upload();
            });
        } else {
            this.upload();
        }
    }
    upload(): void {
        if (this.uploads) {
            this.uploads.map((file2upload) => {
                if (file2upload.file) {
                    this.currentFileUpload = new FileUpload(file2upload.file);
                    const data = {
                        projectKey: this.projectKey,
                        ...file2upload.fileData,
                    };
                    this.uploadService
                        .pushFileToStorage(this.currentFileUpload, data)
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
            });
        }
    }
    singleBeforeUpload(data: any): void {
        if (this.projectKey === '') {
            this.createProject().then(() => {
                this.singleUpload(data);
            });
        } else {
            this.singleUpload(data);
        }
    }
    singleUpload(file2upload: any): void {
        if (file2upload.file) {
            this.currentFileUpload = new FileUpload(file2upload.file);
            const data = {
                projectKey: this.projectKey,
                ...file2upload.fileData,
                isActive: this.addAsActive,
            };
            this.pushFileToStorage(
                this.currentFileUpload,
                data,
                null,
                file2upload
            ).subscribe(
                (percentage) => {
                    file2upload.done = Math.round(percentage ? percentage : 0);
                },
                () => {
                    this.snackBar.snackbarError('Error while uploading file.');
                }
            );
        }
    }
    pushFileToStorage(
        fileUpload: FileUpload,
        data: any,
        allowReplace: any = null,
        hanldeDone: any = null
    ): Observable<number | undefined> {
        const timestamp = new Date().getTime();
        const filePath = `${this.basePath}/${timestamp}_${fileUpload.file.name}`;
        const storageRef = this.storage.ref(filePath);
        const uploadTask = this.storage.upload(filePath, fileUpload.file);

        uploadTask
            .snapshotChanges()
            .pipe(
                finalize(() => {
                    storageRef.getDownloadURL().subscribe((downloadURL) => {
                        fileUpload.data.projectKey = data.projectKey;
                        fileUpload.data.url = downloadURL;
                        fileUpload.data.name = fileUpload.file.name;
                        fileUpload.data.height = toNumber(data.height);
                        fileUpload.data.width = toNumber(data.width);
                        fileUpload.data.size = toNumber(data.size);
                        fileUpload.data.extension = toString(data.extension)
                            .trim()
                            .toUpperCase();
                        fileUpload.data.isActive = data.isActive;

                        const isReplace = isBoolean(allowReplace?.isReplace);
                        if (isReplace) {
                            fileUpload.data.createdAt =
                                firebase.default.database.ServerValue.TIMESTAMP;
                            fileUpload.data.updatedAt =
                                firebase.default.database.ServerValue.TIMESTAMP;
                            this.uploadsRef.push(fileUpload.data).then(() => {
                                // const replaceData = {
                                //     oldKey: toString(allowReplace?.replaceKey),
                                //     newKey: toString(x.key),
                                //     newHeight: toNumber(data.height),
                                //     newWidth: toNumber(data.width),
                                //     comments2replace: cloneDeep(
                                //         allowReplace?.comments2replace
                                //     ),
                                //     oldImg: cloneDeep(allowReplace?.oldImg),
                                // };
                            });
                        } else {
                            if (data.isActive) {
                                this.uploadService.saveFileData(
                                    fileUpload.data
                                );
                                this.projectService.updateUploadCount(
                                    data.projectKey,
                                    1
                                );
                                hanldeDone.fileProcessed = true;
                            } else {
                                fileUpload.data.createdAt =
                                    firebase.default.database.ServerValue.TIMESTAMP;
                                fileUpload.data.updatedAt =
                                    firebase.default.database.ServerValue.TIMESTAMP;
                                this.uploadsRef
                                    .push(fileUpload.data)
                                    .then((x) => {
                                        this.uploadKeys.push(x.key);
                                    });
                                hanldeDone.fileProcessed = true;
                            }
                        }
                        this.fileUploadDone = this.checkFileUploadDone();
                    });
                })
            )
            .subscribe();
        return uploadTask.percentageChanges();
    }
    checkFileUploadDone(): boolean {
        let flag = true;
        this.uploads.forEach((upload) => {
            if (!upload.fileProcessed) {
                flag = false;
                return;
            }
        });
        return flag;
    }
    //#region modal
    myModal() {
        if (!this.modalService.hasOpenModals()) {
            this.modalService.open(this.content, {
                backdropClass: 'share-backdrop',
            });
        }
    }
    removeFile(file2delete: any) {
        let validFiles = cloneDeep(this.uploads);
        validFiles = validFiles.filter(
            (fileData: any) => fileData.file.name !== file2delete.file.name
        );
        this.removeUploads.push(toString(file2delete.file.name));
        this.uploads = validFiles;
    }
    handleClose() {
        this.confirmDelete = true;
    }
    handleConfirmClose() {
        this.confirmDelete = false;
    }
    closeModal() {
        const fileInput = document.getElementById(`file-chooser-${this.id}`);
        (fileInput as any).value = '';
        this.modalService.dismissAll(this.content);
    }
    createMarkup(): void {
        const id2delete = [];
        this.removeUploads.map((u) => {
            this.allUploads
                .filter(
                    (x) =>
                        x.name === u &&
                        x.isActive &&
                        x.projectKey === this.projectKey
                )
                .map((y) => {
                    id2delete.push(y.key);
                    this.uploadService.changeStatus(y.key, false);
                    this.projectService.updateUploadCount(this.projectKey, -1);
                });
        });
        this.projectService.changeStatus(this.projectKey, true);
        this.closeModal();
        void this.router.navigate(['/project', this.projectKey]);
    }
    addPictures(): void {
        if (this.uploadKeys && this.uploadKeys.length > 0) {
            this.uploadKeys.forEach((x) => {
                this.uploadService.changeStatus(x, true);
                this.projectService.updateUploadCount(this.projectKey, 1);
            });
        }

        this.closeModal();
    }
    //#endregion
}
