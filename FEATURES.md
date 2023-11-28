# Creed API Endpoints

## No Auth
| Name                    | Endpoint                    | Description                                                                       | Progress |
| ----------------------- | --------------------------- | --------------------------------------------------------------------------------- | -------- |
| Signup(Email)           | `/api/auth/signup`          | To signup with email                                                              | Done     |
| Signup(Google)          | `/api/auth/signup-google`   | To signup with google                                                             | Done     |
| Signin(Email/Password)  | `/api/auth/login`           | To signin with email                                                              | Done     |
| Signin(Google)          | `/api/auth/signin-google`   | To signin with google                                                             | Done     |
| Forgot Password         | `/api/auth/forgot-password` | Find account via email, and send a password reset link to email if account exists | Done     |
| Contact form submission | `/api/feedback/message`     | Receive a message from users, should have a challenge to prevent bot submissions  | Review   |


## Dashboard
| Name                                                           | Endpoint                         | Description                                                                    | Progress |
| -------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------ | -------- |
| Get/Edit Profile                                               | `/api/user/`                     | To retrieve and edit some profile data                                         | Review   |
| Create/Edit/Delete Board                                       | `/api/domains/{domainId}/boards` | To Create, edit and delete a board                                             | Review   |
| Column/Status - Create/Edit/Delete from Board                  | `/api/status/{boardId}`          | To create, edit, delete (also alter order of status) in boards                 | Todo     |
| Task - add/edit/delete from status/column in Board             | `/api/task/{boardId}`            | To create, edit, delete (also alter order of task) in status                   | Todo     |
| Subtask - Create/Edit/Delete from Task                         | `/api/subtask/{taskId}`          | To create, edit, delete in task                                                | Todo     |
| Notes - add/edit/delete from Announcements                     | `/api/notes`                     | To create, edit, delete, pin announcements                                     | Todo     |
| Domains - create/list/edit/delete                              | `/api/domains`                   | To create, edit, delete, list domains                                          | Ongoing  |
| Collaborators - list/invite/edit priviledge/remove from Domain | `/api/people`                    | To invite, accept(by a non-member), edit, remove member from collaborator list | Todo     |
| Notification - list/read/clear                                 | `/api/notification`              | To create, edit, delete (also alter order of status) in boards                 | Todo     |