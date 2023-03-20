import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
declare const setQuillViewer: any;

@Component({
  selector: 'app-quill-viewer',
  templateUrl: './quill-viewer.component.html',
  styleUrls: ['./quill-viewer.component.scss'],
})
export class QuillViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() content: any;
  id: string;

  constructor() {
    this.id = `quill-editor-${uuidv4()}`;
  }
  ngOnInit(): void {}
  ngOnDestroy(): void {
    this.id = '';
  }
  ngAfterViewInit(): void {
    setQuillViewer(this.id, this.content);
  }
}
