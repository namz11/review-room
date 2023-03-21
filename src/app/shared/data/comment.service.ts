import { Injectable } from '@angular/core';
import {
    AngularFireDatabase,
    AngularFireList,
} from '@angular/fire/compat/database';
import { Comment } from '@models/comment.model';
import { generalUtil } from '@shared/utils/utils';
import * as firebase from 'firebase/compat/app';

@Injectable({
    providedIn: 'root',
})
export class CommentService {
    commentsRef: AngularFireList<Comment>;
    private dbPath = '/comments';

    constructor(private db: AngularFireDatabase) {
        this.commentsRef = db.list(this.dbPath);
    }

    getAll(): AngularFireList<Comment> {
        return this.commentsRef;
    }

    create(comment: Comment): any {
        comment.createdAt = firebase.default.database.ServerValue.TIMESTAMP;
        comment.updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
        const uid = generalUtil.getCurrentUserKey();
        comment.createdBy = uid;
        return this.commentsRef.push(comment);
    }

    updateContent(key: string, content: any): Promise<void> {
        const updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
        const uid = generalUtil.getCurrentUserKey();
        return this.commentsRef.update(key, {
            content,
            updatedAt,
            updatedBy: uid,
        });
    }

    changeStatus(key: string, set: number): Promise<void> {
        const updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
        const uid = generalUtil.getCurrentUserKey();
        return this.commentsRef.update(key, {
            resolvedBy: uid,
            status: set,
        });
    }

    update(key: string, comment: any): Promise<void> {
        const uid = generalUtil.getCurrentUserKey();
        comment.updatedBy = uid;
        return this.commentsRef.update(key, comment);
    }

    updateNewTags(key: string, newTags: any = []): Promise<void> {
        return this.commentsRef.update(key, { newTags });
    }

    private updateTime(key: string): Promise<void> {
        const updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
        const uid = generalUtil.getCurrentUserKey();
        return this.commentsRef.update(key, { updatedAt, updatedBy: uid });
    }

    private hardDelete(key: string): Promise<void> {
        return this.commentsRef.remove(key);
    }
}
