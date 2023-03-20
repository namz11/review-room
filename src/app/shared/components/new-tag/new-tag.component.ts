import { Component, Input } from '@angular/core';
@Component({
  selector: 'app-new-tag',
  template:
    '<span class="new-tag" [ngClass]="{ projectTag: isProject }">New</span>',
  styleUrls: ['./new-tag.component.scss'],
})
export class NewTagComponent {
  @Input() isProject = false;
}
