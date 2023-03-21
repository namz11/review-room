import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { AuthService } from '@app/auth/services/auth.service';
import { SnackbarService } from '@shared/providers/snackbar.service';
import { MustMatch } from '@shared/providers/must-match.validator';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
    hideRequiredControl = new UntypedFormControl(false);
    floatLabelControl = new UntypedFormControl('always');

    isLoading = false;
    returnUrl = '';
    msg2show = '';

    public isSubmitted = false;
    public registerForm: UntypedFormGroup;

    users: any;

    constructor(
        private readonly formBuilder: UntypedFormBuilder,
        private readonly router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private snackBar: SnackbarService
    ) {
        this.registerForm = this.formBuilder.group(
            {
                email: [
                    '',
                    [
                        Validators.required,
                        Validators.pattern(
                            /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/
                        ),
                    ],
                ],
                fullName: ['', Validators.required],
                password: ['', Validators.required],
                confirmPass: ['', Validators.required],
                terms: [false, Validators.requiredTrue],
                hideRequired: this.hideRequiredControl,
                floatLabel: this.floatLabelControl,
            },
            {
                validator: MustMatch('password', 'confirmPass'),
            }
        );
    }

    public get _form(): any {
        return this.registerForm.controls;
    }

    ngOnInit(): void {
        // get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    public register(): void {
        this.isSubmitted = true;

        // stop here if form is invalid
        if (this.registerForm.invalid) {
            return;
        }

        this.isLoading = true;
        this.authService
            .signUp(this.registerForm.value)
            .then(() => {
                this.msg2show = '';
                this.isLoading = false;
                this.router.navigate(['/auth/signin'], {
                    queryParams: { returnUrl: this.returnUrl },
                });
            })
            .catch((error) => {
                this.isLoading = false;
                this.msg2show = error.message;
            });
    }
}

// TODO proper field validations for all 3 forms
// TODO terms & conditions
