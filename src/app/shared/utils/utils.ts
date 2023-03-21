import {
    debounceTime,
    map,
    distinctUntilChanged,
    filter,
} from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { ProjectViewModel } from '@models/project.model';
import { cloneDeep, toString } from 'lodash-es';
import { environment } from '@environments/environment';

export const generalUtil = {
    textBoxEventOnStopType: (input: any, event: any) => {
        fromEvent(input, 'keyup')
            .pipe(
                map((_event: any) => _event.target.value),
                filter((res) => res.length >= 0),
                debounceTime(600),
                distinctUntilChanged()
            )
            .subscribe((text: string) => event(text));
    },
    // generates random strings
    generateString: (length = 7) => {
        // declare all characters
        const characters =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            );
        }

        return result;
    },
    getCurrentUserKey: () => toString(localStorage.getItem('uid')).trim(),
    setCurrentUserKey: (uid: string) =>
        localStorage.setItem('uid', toString(uid).trim()),
    getCurrentUserEmail: () => {
        const details = JSON.parse(
            toString(localStorage.getItem('userDetails'))
        );
        return toString(details?.email).trim();
    },
};

export const projectUtil = {
    isSharedWithMe: (
        project: ProjectViewModel,
        uid: string = '',
        email: string = ''
    ) => {
        uid = uid === '' ? generalUtil.getCurrentUserKey() : uid;
        email = email === '' ? generalUtil.getCurrentUserEmail() : email;
        const flag = {
            createdBy: false,
            sharedWithUser: false,
            sharedWithEmail: false,
        };
        if (project?.sharedUsers) {
            if (project?.sharedUsers.length > 0) {
                flag.sharedWithUser =
                    (project?.sharedUsers as string[]).includes(uid.trim()) &&
                    project.isActive;
            }
        }
        if (project?.allowedEmails) {
            if (project?.allowedEmails.length > 0) {
                flag.sharedWithEmail =
                    (project?.allowedEmails as string[]).includes(
                        email.trim()
                    ) && project.isActive;
            }
        }
        return flag;
    },
    allowProject: (
        project: ProjectViewModel,
        uid: string = '',
        email: string = ''
    ) => {
        uid = uid === '' ? generalUtil.getCurrentUserKey() : uid;
        email = email === '' ? generalUtil.getCurrentUserEmail() : email;
        if (project.createdBy === uid && project.isActive) {
            return {
                createdBy: true,
                sharedWithUser: false,
                sharedWithEmail: false,
            };
        } else {
            const flag = projectUtil.isSharedWithMe(project, uid, email);
            return flag;
        }
    },
    makeUpdatedProjectShare: (keys: string[] = [], emails: string[] = []) => {
        keys = keys ? cloneDeep(keys) : [];
        emails = emails ? cloneDeep(emails) : [];
        const email = generalUtil.getCurrentUserEmail();
        const idx = emails.indexOf(email);
        if (idx > -1) {
            emails.splice(idx, 1);
            keys.push(generalUtil.getCurrentUserKey());
        }
        return cloneDeep({ sharedUsers: keys, allowedEmails: emails });
    },
    getShareLink: (key: string = '') => {
        const share =
            toString(key).trim() !== ''
                ? toString(key).trim()
                : generalUtil.generateString();
        return {
            url: `${environment.baseUrl}/invite/link/${share}`,
            key: share,
        };
    },
    makeUpdatedProjectInvite: (project: ProjectViewModel) => {
        const { sharedUsers, allowedEmails, createdBy } = project;
        const keys: string[] = sharedUsers ? cloneDeep(sharedUsers) : [];
        const emails: string[] = allowedEmails ? cloneDeep(allowedEmails) : [];
        const uid = generalUtil.getCurrentUserKey();
        if (uid !== '') {
            if (uid !== createdBy) {
                keys.push(uid);
            }
        }
        return cloneDeep({ sharedUsers: keys, allowedEmails: emails });
    },
    createNewTag: (sharedUsers: string[] = [], createdBy: string = '') => {
        const uid = generalUtil.getCurrentUserKey();
        const allUsers = cloneDeep(sharedUsers);
        if (uid !== '') {
            allUsers.push(uid);
        }
        if (createdBy !== '') {
            allUsers.push(createdBy);
        }
        // array
        // const newTags = allUsers.map((user) => {
        //   if (user === uid) {
        //     return { [user]: false };
        //   } else {
        //     return { [user]: true };
        //   }
        // });
        let newTags = {};
        allUsers.forEach((user) => {
            if (user === uid) {
                newTags = { ...newTags, [user]: false };
            } else {
                newTags = { ...newTags, [user]: true };
            }
        });
        return newTags;
    },
    updateNewTag: (tags = {}) => {
        const uid = generalUtil.getCurrentUserKey();
        if (uid !== '') {
            return { ...tags, [uid]: false };
        }
        return tags;
    },
    showNewTag: (tags = {}) => {
        const uid = generalUtil.getCurrentUserKey();
        if (uid !== '') {
            const keys = Object.keys(tags);
            let flag = false;
            keys.forEach((key) => {
                if (key === uid) {
                    flag = (tags as any)[key];
                }
            });
            return flag;
        }
        return false;
    },
};
