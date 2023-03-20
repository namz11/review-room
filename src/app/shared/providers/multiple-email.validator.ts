import { UntypedFormGroup } from '@angular/forms';

// custom validator to check that two fields match
export const multipleEmail =
  (controlName: string) => (formGroup: UntypedFormGroup) => {
    const emailMatcher = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const control = formGroup.controls[controlName];

    if (control.errors && !control.errors['multipleEmail']) {
      // return if another validator has already found an error on the matchingControl
      return;
    }

    let isValid = true;
    if (control.value) {
      control.value.forEach((email: string) => {
        if (isValid) {
          const flag = emailMatcher.test(email);
          isValid = flag;
        } else {
          return;
        }
      });
    }
    // set error on control if validation fails
    if (isValid) {
      control.setErrors(null);
    } else {
      control.setErrors({ multipleEmail: true });
    }
  };
