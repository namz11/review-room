import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeaderComponent } from './header/header.component';
import { HeaderOnlyLayoutComponent } from './header-only-layout/header-only-layout.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { LayoutRoutingModule } from './layout-routing.module';
import { MatMenuModule } from '@angular/material/menu';

import { MatDividerModule } from '@angular/material/divider';
import { SharedModule } from '@shared/shared.module';
import { LandingPageComponent } from './landing-page/landing-page.component';
@NgModule({
  declarations: [
    HeaderComponent,
    HeaderOnlyLayoutComponent,
    MainLayoutComponent,
    LandingPageComponent,
  ],
  imports: [
    CommonModule,
    LayoutRoutingModule,

    MatDividerModule,
    SharedModule,
    MatMenuModule,
  ],
  exports: [],
})
export class LayoutModule {}
