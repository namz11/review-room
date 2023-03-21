import { Injectable } from '@angular/core';
import {
    AngularFireDatabase,
    AngularFireList,
} from '@angular/fire/compat/database';
import { User } from '@models/user.model';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    usersRef: AngularFireList<User>;
    private dbPath = '/users';

    constructor(private db: AngularFireDatabase) {
        this.usersRef = db.list(this.dbPath);
    }

    getAll(): AngularFireList<User> {
        return this.usersRef;
    }

    create(user: User): any {
        // TODO move this to constructor
        user.email = user?.email?.toLowerCase() || '';
        user.username = user?.username?.toLowerCase() || '';

        return this.usersRef.push(user);
    }

    update(key: string, value: any): Promise<void> {
        // TODO move this to constructor
        value.email = value?.email?.toLowerCase() || '';
        value.username = value?.username?.toLowerCase() || '';

        return this.usersRef.update(key, value);
    }

    private hardDelete(key: string): Promise<void> {
        return this.usersRef.remove(key);
    }
}
