import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { toString } from 'lodash-es';
import { FileChooserComponent } from '@shared/components/file-chooser/file-chooser.component';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { AuthService } from '@app/auth/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, AfterViewInit {
  @ViewChild(FileChooserComponent, { static: true })
  public fileChooserComponent!: FileChooserComponent;

  public filesForm: UntypedFormGroup;

  public shortName = '';

  constructor(
    private formBuilder: UntypedFormBuilder,
    private authService: AuthService
  ) {
    const user = JSON.parse(toString(localStorage.getItem('userDetails')));
    const name =
      toString(user.fullName).trim() || toString(user.username).trim();
    this.shortName = name.substring(0, 2);
    this.filesForm = this.formBuilder.group({
      uploadFiles: null,
    });
  }

  ngOnInit(): void {
    this.filesForm = this.formBuilder.group({
      uploadFiles: this.fileChooserComponent.createFormGroup(),
    });
  }
  ngAfterViewInit(): void {
    const user = JSON.parse(toString(localStorage.getItem('userDetails')));
    const name =
      toString(user.fullName).trim() || toString(user.username).trim();
    this.shortName = name.substring(0, 2);
  }

  signOut(): void {
    this.authService.signOut();
  }
}
