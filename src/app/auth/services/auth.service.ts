import { Injectable } from '@angular/core';
import { AuthUser } from '@app/auth/models/auth.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
    AngularFirestore,
    AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { toString } from 'lodash-es';
import { UserService } from '@data/user.service';
import { User, UserViewModel } from '@models/user.model';
import { map } from 'rxjs/operators';
import { SnackbarService } from '@shared/providers/snackbar.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    userData: any; // Save logged in user data
    users: UserViewModel[] = [];

    constructor(
        private afs: AngularFirestore, // Inject Firestore service
        private afAuth: AngularFireAuth, // Inject Firebase auth service
        private router: Router,
        private userService: UserService,
        private snackBar: SnackbarService
    ) {
        /* Saving user data in localstorage when
		logged in and setting up null when logged out */
        this.afAuth.authState.subscribe((user) => {
            if (user) {
                // setup user for FreshChat
                this.setupFreshChatUser(user);

                if (user?.emailVerified) {
                    this.userData = user;
                    localStorage.setItem('user', JSON.stringify(this.userData));
                    localStorage.setItem('uid', toString(user.uid).trim());
                } else {
                    this.afAuth.signOut();
                    localStorage.removeItem('user');
                }
            } else {
                localStorage.removeItem('user');
            }
        });
        this.retrieveUsers();
    }

    setupFreshChatUser(userInfo: any): void {
        (window as any).fcWidget.user.isExists().then(
            function (data: any) {
                if (data.data) {
                    (window as any).fcWidget.user.update({
                        firstName: `${userInfo.displayName}`,
                        lastName: `${userInfo.uid}`,
                        email: `${userInfo.email}`,
                    });
                } else {
                    (window as any).fcWidget.user.create({
                        firstName: `${userInfo.displayName}`,
                        lastName: `${userInfo.uid}`,
                        email: `${userInfo.email}`,
                    });
                }
            },
            function () {
                console.error('FC --- Error fetching user');
            }
        );
    }
    // Returns true when user is logged in
    get isLoggedIn(): boolean {
        const user =
            localStorage.getItem('user') != null
                ? JSON.parse(toString(localStorage.getItem('user')))
                : null;

        return user !== null && user.emailVerified && user.apiKey !== ''
            ? true
            : false;
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
                this.users = data.map((u) =>
                    new UserViewModel().deserialize(u)
                );
                const user = this.users.filter(
                    (u) => u.userKey === toString(this.userData?.uid).trim()
                )[0];
                localStorage.setItem('userDetails', JSON.stringify(user));
            });
    }

    // Sign in with email/password
    signIn(email: string, password: string) {
        return this.afAuth
            .signInWithEmailAndPassword(email, password)
            .then((result) => {
                if (result.user?.emailVerified) {
                    localStorage.setItem('user', JSON.stringify(result?.user));
                    localStorage.setItem(
                        'uid',
                        toString(result?.user?.uid).trim()
                    );

                    const user = this.users.filter(
                        (u) => u.userKey === toString(result.user?.uid)
                    )[0];
                    localStorage.setItem('userDetails', JSON.stringify(user));
                } else {
                    this.snackBar.snackbarWarning(
                        'Please verify your email to use Review Room!'
                    );
                }
            });
    }

    // Sign up with email/password
    signUp(details: any) {
        return this.afAuth
            .createUserWithEmailAndPassword(details.email, details.password)
            .then((result) => {
                this.emailVerification();
                const user = new User();
                user.userKey = toString(result?.user?.uid);
                user.fullName = details.fullName;
                user.email = details.email;
                this.userService.create(user);
            });
    }

    // Reset password
    forgotPassword(passwordResetEmail: string) {
        return this.afAuth.sendPasswordResetEmail(passwordResetEmail);
    }

    signOut() {
        return this.afAuth.signOut().then(() => {
            localStorage.removeItem('user');
            this.router.navigate(['/auth/signin']);
        });
    }

    /* Setting up user data when sign in with username/password,
	sign up with username/password and sign in with social auth
	provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
    setUserData(user: any) {
        const userRef: AngularFirestoreDocument<any> = this.afs.doc(
            `users/${user.uid}`
        );

        const userData: AuthUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
        };

        return userRef.set(userData, {
            merge: true,
        });
    }

    // TODO add user page so that user an request for this
    emailVerification() {
        this.afAuth.currentUser.then((user) => {
            user?.sendEmailVerification().then(() => {
                this.snackBar.snackbarSuccess(
                    'Verification email sent, check your inbox'
                );
            });
        });
    }
}
