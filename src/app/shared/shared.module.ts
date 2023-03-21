import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FileChooserComponent } from './components/file-chooser/file-chooser.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { Bytes2String } from '@shared/utils/bytes2string.pipe';

import { OverlayModule } from '@angular/cdk/overlay';
import { QuillEditorComponent } from './components/quill-editor/quill-editor.component';
import { QuillViewerComponent } from './components/quill-viewer/quill-viewer.component';
import { EditorComponent } from './components/editor/editor.component';
import { NewTagComponent } from './components/new-tag/new-tag.component';
import { LogoComponent } from './components/logo/logo.component';

@NgModule({
    declarations: [
        FileChooserComponent,
        Bytes2String,
        QuillEditorComponent,
        QuillViewerComponent,
        EditorComponent,
        NewTagComponent,
        LogoComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        OverlayModule,
    ],
    exports: [
        FileChooserComponent,
        Bytes2String,
        QuillEditorComponent,
        QuillViewerComponent,
        EditorComponent,
        NewTagComponent,
        LogoComponent,
    ],
})
export class SharedModule {}
