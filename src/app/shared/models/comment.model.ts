export class Comment {
  public imageKey = '';
  public projectKey = '';
  public x = 0;
  public y = 0;
  public content: any;
  public index = 0;
  public status = 0; // 0 = inactive, 1 = active, 2 = resolved
  public createdAt: any;
  public updatedAt: any;
  public createdBy = '';
  public updatedBy = '';
  public parentKey = '';
  public resolvedBy = '';
  public newTags: any;

  deserialize(input: any): Comment {
    const output = new Comment();
    if (input) {
      output.imageKey = input.imageKey || '';
      output.projectKey = input.projectKey;
      output.x = input.x || -1;
      output.y = input.y || -1;
      output.content = input.content;
      output.index = input.index || 0;
      output.status = input.status || 0;
      output.createdAt = input.createdAt;
      output.updatedAt = input.updatedAt;
      output.createdBy = input.createdBy || '';
      output.updatedBy = input.updatedBy || '';
      output.parentKey = input.parentKey || '';
      output.resolvedBy = input.resolvedBy || '';
      output.newTags = input.newTags || {};
    }
    return output;
  }
}

export class CommentViewModel {
  public key = '';
  public imageKey = '';
  public projectKey = '';
  public x = 0;
  public y = 0;
  public pinX = 0;
  public pinY = 0;
  public content: any;
  public index = 0;
  public status = 0; // 0 = inactive, 1 = active, 2 = resolved
  public createdAt: any;
  public updatedAt: any;
  public createdBy = '';
  public updatedBy = '';
  public displayName = '';
  public parentKey = '';
  public children: any = [];
  public resolvedBy = '';
  public newTags: any;

  deserialize(input: any): CommentViewModel {
    const output = new CommentViewModel();
    if (input) {
      output.key = input.key;
      output.imageKey = input.imageKey || '';
      output.projectKey = input.projectKey;
      output.x = input.x || -1;
      output.y = input.y || -1;
      output.content = input.content;
      output.index = input.index || 0;
      output.status = input.status || 0;
      output.createdAt = input.createdAt;
      output.updatedAt = input.updatedAt;
      output.createdBy = input.createdBy || '';
      output.updatedBy = input.updatedBy || '';
      output.displayName = input.displayName || '';
      output.parentKey = input.parentKey || '';
      output.resolvedBy = input.resolvedBy || '';
      output.newTags = input.newTags || {};
    }
    return output;
  }
}

// TODO add enums & proper types
