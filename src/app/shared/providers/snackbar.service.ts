import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
    providedIn: 'root',
})
export class SnackbarService {
    private config: MatSnackBarConfig = {
        duration: 2000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
    };
    private configSuccess: MatSnackBarConfig = {
        ...this.config,
        panelClass: ['style-success'],
    };
    private configError: MatSnackBarConfig = {
        ...this.config,
        panelClass: ['style-error'],
    };
    private configWarning: MatSnackBarConfig = {
        ...this.config,
        panelClass: ['style-warning'],
    };

    constructor(private matSnackBar: MatSnackBar) {}

    public snackbarSuccess(message: string): void {
        this.matSnackBar.open(message, 'x', this.configSuccess);
    }
    public snackbarError(message: string): void {
        this.matSnackBar.open(message, 'x', this.configError);
    }
    public snackbarWarning(message: string): void {
        this.matSnackBar.open(message, 'x', this.configWarning);
    }
}
