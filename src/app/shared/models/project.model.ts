import { Picture, PictureViewModel } from './file.model';

export class Project {
    public name = '';
    public commentCount: any = 0;
    public uploadCount: any = 0;
    public createdAt: any;
    public updatedAt: any;
    public createdBy = '';
    public isActive = false;
    // public sendEmail = false;
    public sharedUsers = [];
    public allowedEmails: string[] = [];
    public newTags: any;
    public inviteLink = '';

    deserialize(input: any): Project {
        const output = new Project();
        if (input) {
            output.name = input.name;
            output.commentCount = input.commentCount || 0;
            output.uploadCount = input.uploadCount || 0;
            output.createdAt = input.createdAt;
            output.updatedAt = input.updatedAt;
            output.createdBy = input.createdBy;
            output.isActive = input.isActive || false;
            // output.sendEmail = input.sendEmail || false;
            output.sharedUsers = input.sharedUsers || [];
            output.allowedEmails = (input.allowedEmails || []).map((x: any) =>
                x?.toLowerCase()
            );
            output.newTags = input.newTags || {};
            output.inviteLink = input.inviteLink;
        }
        return output;
    }
}

export class ProjectViewModel {
    public key = '';
    public name = '';
    public commentCount = 0;
    public uploadCount = 0;
    public createdAt: any;
    public updatedAt: any;
    public thumbnail: PictureViewModel = new PictureViewModel();
    public createdBy = '';
    public isActive = false;
    public isLoading = false;
    // public sendEmail = false;
    public sharedUsers = [];
    public allowedEmails = [];
    public newTags: any;
    public inviteLink = '';

    deserialize(input: any): ProjectViewModel {
        const output = new ProjectViewModel();
        if (input) {
            output.key = input.key;
            output.name = input.name;
            output.commentCount = input.commentCount;
            output.uploadCount = input.uploadCount;
            output.createdAt = input.createdAt;
            output.updatedAt = input.updatedAt;
            output.createdBy = input.createdBy;
            output.isActive = input.isActive || false;
            // output.sendEmail = input.sendEmail || false;
            output.sharedUsers = input.sharedUsers || [];
            output.allowedEmails = (input.allowedEmails || []).map((x: any) =>
                x?.toLowerCase()
            );
            output.newTags = input.newTags || {};
            output.inviteLink = input.inviteLink;
        }
        return output;
    }
}

// TODO add enums & proper types
