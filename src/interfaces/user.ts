export interface User extends Document {
  _id: string;

  username: string;
  usernameLower: string;

  email: string;
  password: string; // hashed password

  createdAt?: Date;
  updatedAt?: Date;
}