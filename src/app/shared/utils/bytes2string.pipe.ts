import { Pipe, PipeTransform } from '@angular/core';
import { toNumber } from 'lodash-es';

@Pipe({ name: 'bytes2string' })
export class Bytes2String implements PipeTransform {
  transform(bytes: any): string {
    const decimals = 2;
    bytes = toNumber(bytes);

    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
