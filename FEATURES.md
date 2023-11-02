# Creed API Endpoints

## No Auth
| Name                    | Endpoint                    | Description                                                                       | Progress |
| ----------------------- | --------------------------- | --------------------------------------------------------------------------------- | -------- |
| Signup(Email)           | `/api/auth/signup`          | To signup with email                                                              | Review   |
| Signup(Google)          | `/api/auth/signup-google`   | To signup with google                                                             | Todo     |
| Signin(Email/Password)  | `/api/auth/login`           | To signin with email                                                              | Review   |
| Signin(Google)          | `/api/auth/signin-google`   | To signin with google                                                             | Todo     |
| Forgot Password         | `/api/auth/forgot-password` | Find account via email, and send a password reset link to email if account exists | Todo     |
| Contact form submission | `/api/service/contact`      | Receive a message from users, should have a challenge to prevent bot submissions  | Todo     |


## Dashboard
| Name                                                           | Endpoint | Description | Progress |
| -------------------------------------------------------------- | -------- | ----------- | -------- |
| Get/Edit Profile                                               |
| Create/Edit/Delete Board                                       |
| Column/Status - Create/Edit/Delete from Board                  |
| Subtask - Create/Edit/Delete from Task                         |
| Task - add/edit/delete from status/column in Board             |
| Notes - add/edit/delete from Announcements                     |
| Collaborators - list/invite/edit priviledge/remove from Domain |
| Notification - list/read/clear                                 |