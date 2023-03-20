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

@Component({
  selector: 'app-forgot-pass',
  templateUrl: './forgot-pass.component.html',
  styleUrls: ['./forgot-pass.component.scss'],
})
export class ForgotPassComponent implements OnInit {
  hideRequiredControl = new UntypedFormControl(false);
  floatLabelControl = new UntypedFormControl('always');

  isLoading = false;
  returnUrl = '';
  msg2show = '';
  forgotForm: UntypedFormGroup;
  public isSubmitted = false;

  users: any;

  constructor(
    private readonly formBuilder: UntypedFormBuilder,
    private readonly router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private snackBar: SnackbarService
  ) {
    this.forgotForm = this.formBuilder.group({
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/),
        ],
      ],
      hideRequired: this.hideRequiredControl,
      floatLabel: this.floatLabelControl,
    });
  }

  get _form(): any {
    return this.forgotForm.controls;
  }

  ngOnInit(): void {
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  public forgotPassword(): void {
    this.isSubmitted = true;

    // stop here if form is invalid
    if (this.forgotForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.authService
      .forgotPassword(this.forgotForm.value.email)
      .then(() => {
        this.msg2show = '';
        this.snackBar.snackbarSuccess(
          'Password reset email sent, check your inbox'
        );
        this.isLoading = false;
      })
      .catch((error) => {
        this.isLoading = false;
        this.msg2show = error.message;
      });
  }
}
