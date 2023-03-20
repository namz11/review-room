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
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  hideRequiredControl = new UntypedFormControl(false);
  floatLabelControl = new UntypedFormControl('always');

  isLoading = false;

  returnUrl = '';
  msg2show = '';

  public loginForm: UntypedFormGroup;
  public isSubmitted = false;

  users: any;

  constructor(
    private readonly formBuilder: UntypedFormBuilder,
    private readonly router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private snackBar: SnackbarService
  ) {
    this.loginForm = this.formBuilder.group({
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/),
        ],
      ],
      password: ['', Validators.required],
      hideRequired: this.hideRequiredControl,
      floatLabel: this.floatLabelControl,
    });
  }

  public get _form(): any {
    return this.loginForm.controls;
  }

  ngOnInit(): void {
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  public login(): void {
    this.isSubmitted = true;

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    this.authService
      .signIn(this.loginForm.value.email, this.loginForm.value.password)
      .then(() => {
        this.msg2show = '';
        this.isLoading = false;
        this.router.navigate([this.returnUrl]);
      })
      .catch((error) => {
        this.msg2show = error.message;
        this.isLoading = false;
      });
  }
}
