import { Injectable } from '@angular/core';
import {
    AngularFireDatabase,
    AngularFireList,
} from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';

import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { FileUpload, Picture } from '@models/file.model';
import { toNumber, cloneDeep, toString, isBoolean } from 'lodash-es';
import * as firebase from 'firebase/compat/app';
import { ProjectService } from './project.service';
import { CommentService } from './comment.service';
import { Comment } from '@models/comment.model';

@Injectable({
    providedIn: 'root',
})
export class FileUploadService {
    uploadsRef: AngularFireList<Picture>;
    private basePath = '/uploads';

    constructor(
        private db: AngularFireDatabase,
        private storage: AngularFireStorage,
        private projectService: ProjectService, // private data: Data
        private commentService: CommentService // private data: Data
    ) {
        this.uploadsRef = db.list(this.basePath);
    }

    pushFileToStorage(
        fileUpload: FileUpload,
        data: any,
        allowReplace: any = null
    ): Observable<number | undefined> {
        const timestamp = new Date().getTime();
        const filePath = `${this.basePath}/${fileUpload.file.name}_${timestamp}`;
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
                            this.uploadsRef.push(fileUpload.data).then((x) => {
                                const replaceData = {
                                    oldKey: toString(allowReplace?.replaceKey),
                                    newKey: toString(x.key),
                                    newHeight: toNumber(data.height),
                                    newWidth: toNumber(data.width),
                                    comments2replace: cloneDeep(
                                        allowReplace?.comments2replace
                                    ),
                                    oldImg: cloneDeep(allowReplace?.oldImg),
                                };
                                this.replaceComments(replaceData);
                            });
                        } else {
                            this.saveFileData(fileUpload.data);
                            if (data.isActive) {
                                this.projectService.updateUploadCount(
                                    data.projectKey,
                                    1
                                );
                            }
                        }
                    });
                })
            )
            .subscribe();
        return uploadTask.percentageChanges();
    }
    changeStatus(key: string, set: boolean): Promise<void> {
        const updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
        return this.uploadsRef.update(key, { updatedAt, isActive: set });
    }
    updateName(key: string, name: string): Promise<void> {
        const updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
        return this.uploadsRef.update(key, { updatedAt, name });
    }
    getFiles(numberItems: number): AngularFireList<Picture> {
        return this.db.list(this.basePath, (ref) =>
            ref.limitToLast(numberItems)
        );
    }
    getAll(): AngularFireList<Picture> {
        return this.uploadsRef;
    }
    deleteFile(key: string, name: string): void {
        this.deleteFileDatabase(key)
            .then(() => {
                this.deleteFileStorage(name);
            })
            .catch(() => {
                // error msg
            });
    }

    saveFileData(data: Picture): void {
        data.createdAt = firebase.default.database.ServerValue.TIMESTAMP;
        data.updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
        this.uploadsRef.push(data);
    }

    private replaceComments(replaceData: any): void {
        replaceData.comments2replace.map((c: any) => {
            this.commentService.changeStatus(c.key, 0);
        });
        replaceData.comments2replace.map((c: any) => {
            const newX =
                (c.x / toNumber(replaceData.oldImg?.width)) *
                replaceData.newWidth;
            const newY =
                (c.y / toNumber(replaceData.oldImg.height)) *
                replaceData.newHeight;
            const updatedComment = new Comment().deserialize(c);
            updatedComment.x = newX;
            updatedComment.y = newY;
            updatedComment.imageKey = toString(replaceData.newKey);
            this.commentService.update(c.key, updatedComment);
        });
        this.changeStatus(toString(replaceData.oldKey), false);
        this.changeStatus(toString(replaceData.newKey), true);
    }

    private deleteFileDatabase(key: string): Promise<void> {
        return this.uploadsRef.remove(key);
    }
    private deleteFileStorage(name: string): void {
        const storageRef = this.storage.ref(this.basePath);
        storageRef.child(name).delete();
    }
}
