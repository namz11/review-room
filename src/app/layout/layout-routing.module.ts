import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { HeaderOnlyLayoutComponent } from './header-only-layout/header-only-layout.component';
import { AuthGuard } from '@app/auth/services/auth.guard';
import { LandingPageComponent } from './landing-page/landing-page.component';

const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
    },
    {
        path: 'auth',
        component: LandingPageComponent,
        children: [
            {
                path: '',
                loadChildren: () =>
                    import('../auth/auth.module').then((m) => m.AuthModule),
            },
        ],
    },
    {
        path: 'invite',
        component: MainLayoutComponent,
        children: [
            {
                path: 'link',
                loadChildren: () =>
                    import('../project/project.module').then(
                        (m) => m.ProjectModule
                    ),
            },
        ],
    },
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            {
                path: 'project',
                canActivate: [AuthGuard],
                loadChildren: () =>
                    import('../project/project.module').then(
                        (m) => m.ProjectModule
                    ),
            },
        ],
    },
    {
        path: '',
        component: HeaderOnlyLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'dashboard',
                loadChildren: () =>
                    import('../dashboard/dashboard.module').then(
                        (m) => m.DashboardModule
                    ),
            },
        ],
    },
    // otherwise redirect to home
    { path: '**', redirectTo: '' },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class LayoutRoutingModule {}
