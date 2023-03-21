export class User {
    public userKey = '';
    public username = '';
    public fullName = '';
    public email = '';
    public avatar = '';

    deserialize(input: any): User {
        const output = new User();
        if (input) {
            output.username = input.username?.toLowerCase() || '';
            output.fullName = input.fullName || '';
            output.email = input.email?.toLowerCase() || '';
            output.avatar = input.avatar || '';
        }
        return output;
    }
}

export class UserViewModel {
    public key = '';
    public userKey = '';
    public username = '';
    public fullName = '';
    public email = '';
    public avatar = '';
    public is = '';

    deserialize(input: any): UserViewModel {
        const output = new UserViewModel();
        if (input) {
            output.key = input.key;
            output.userKey = input.userKey;
            output.username = input.username?.toLowerCase() || '';
            output.fullName = input.fullName || '';
            output.email = input.email?.toLowerCase() || '';
            output.avatar = input.avatar || '';
        }
        return output;
    }
}
