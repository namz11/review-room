import { Injectable } from '@angular/core';
import {
  AngularFireDatabase,
  AngularFireList,
} from '@angular/fire/compat/database';
import { Project } from '@models/project.model';
import * as firebase from 'firebase/compat/app';
import { uniq } from 'lodash-es';
import { generalUtil, projectUtil } from '@shared/utils/utils';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  projectsRef: AngularFireList<Project>;
  private dbPath = '/projects';

  constructor(private db: AngularFireDatabase) {
    this.projectsRef = db.list(this.dbPath);
  }

  getAll(): AngularFireList<Project> {
    return this.projectsRef;
  }

  create(project: Project): any {
    // TODO move to constructor
    project.createdAt = firebase.default.database.ServerValue.TIMESTAMP;
    project.updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
    const uid = generalUtil.getCurrentUserKey();
    project.createdBy = uid;
    project.inviteLink = projectUtil.getShareLink().key;
    project.allowedEmails = (project?.allowedEmails || []).map((x: any) =>
      x?.toLowerCase()
    );

    return this.projectsRef.push(project);
  }

  update(key: string, value: any): Promise<void> {
    value.updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
    value.allowedEmails = (value?.allowedEmails || []).map((x: any) =>
      x?.toLowerCase()
    );
    return this.projectsRef.update(key, value);
  }

  updateTime(key: string): Promise<void> {
    const updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
    return this.projectsRef.update(key, { updatedAt });
  }

  changeStatus(key: string, set: boolean): Promise<void> {
    const updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
    return this.projectsRef.update(key, { updatedAt, isActive: set });
  }

  updateSettings(key: string, obj2update: any): Promise<void> {
    return this.projectsRef.update(key, { ...obj2update });
  }

  updateShared(
    key: string,
    sharedUsers: any,
    allowedEmails: any = []
  ): Promise<void> {
    allowedEmails = (allowedEmails || []).map((x: any) => x?.toLowerCase());

    return this.projectsRef.update(key, {
      sharedUsers: uniq(sharedUsers),
      allowedEmails: uniq(allowedEmails),
    });
  }

  updateNewTags(key: string, newTags: any = []): Promise<void> {
    return this.projectsRef.update(key, { newTags });
  }

  updateCommentCount(key: string, value: number): Promise<void> {
    const increment = firebase.default.database.ServerValue.increment(value);
    const updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
    return this.projectsRef.update(key, { commentCount: increment, updatedAt });
  }

  updateUploadCount(key: string, value: number): Promise<void> {
    const increment = firebase.default.database.ServerValue.increment(value);
    const updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
    return this.projectsRef.update(key, { uploadCount: increment, updatedAt });
  }

  updateName(key: string, name: string): Promise<void> {
    const updatedAt = firebase.default.database.ServerValue.TIMESTAMP;
    return this.projectsRef.update(key, { updatedAt, name });
  }

  updateInviteLink(key: string, inviteLink: string): Promise<void> {
    return this.projectsRef.update(key, { inviteLink });
  }

  private hardDelete(key: string): Promise<void> {
    return this.projectsRef.remove(key);
  }
}
