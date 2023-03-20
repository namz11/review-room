export class FileUpload {
  public data: Picture = new Picture();
  public file: File;

  constructor(file: File) {
    this.file = file;
  }
}

export class Picture {
  public projectKey = '';
  public name = '';
  public url = '';
  public height = 0;
  public width = 0;
  public size = 0;
  public extension = '';
  public createdAt: any;
  public updatedAt: any;
  public isActive = true;

  deserialize(input: any): Picture {
    const output = new Picture();
    if (input) {
      output.name = input.name;
      output.projectKey = input.projectKey;
      output.url = input.url;
      output.height = input.height;
      output.width = input.width;
      output.size = input.size;
      output.extension = input.extension;
      output.createdAt = input.createdAt;
      output.updatedAt = input.updatedAt;
      output.isActive = input.isActive;
    }
    return output;
  }
}

export class PictureViewModel {
  public key = '';
  public projectKey = '';
  public name = '';
  public url = '';
  public height = 0;
  public width = 0;
  public size = 0;
  public extension = '';
  public createdAt: any;
  public updatedAt: any;
  public isActive = true;

  deserialize(input: any): PictureViewModel {
    const output = new PictureViewModel();
    if (input) {
      output.key = input.key;
      output.projectKey = input.projectKey;
      output.name = input.name;
      output.url = input.url;
      output.height = input.height;
      output.width = input.width;
      output.size = input.size;
      output.extension = input.extension;
      output.createdAt = input.createdAt;
      output.updatedAt = input.updatedAt;
      output.isActive = input.isActive;
    }
    return output;
  }
}
