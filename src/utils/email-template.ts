interface GetEmailTemplateType {
  domainName?: string,
  panelName?: string,
  taskTitle?: string,
  announcementUrl?: string,
  announcementText?: string,
  domainUrl?: string
  verifyEmailLink?: string
  inviteUrl?: string
}

interface GetEmailSubjectType {
  domainName?: string,
  panelName?: string,
  taskTitle?: string
}

export enum Format {
  JOIN_DOMAIN = 'join-domain',
  LEAVE_DOMAIN = 'leave-domain',
  INVITED_TO_DOMAIN = 'invited-to-domain',
  REMOVED_DOMAIN = 'removed-domain',
  INVITED_TO_PANEL = 'invited-to-panel',
  REMOVED_FROM_PANEL = 'removed-from-panel',
  DELETION_OF_TASK = 'deletion-of-task',
  ASSIGNED_TO_TASK = 'assigned-to-task',
  REMOVED_FROM_TASK = 'removed-from-task',
  MENTIONED_ON_CHAT = 'mentioned-on-chat',
  GETTING_PROMOTED = 'getting promoted',
  GETTING_DEMOTED = 'getting-demoted',
  VERIFYING_EMAIL = 'verifying-email'
}

export function getEmailTemplate(format: Format, name: string, args: GetEmailTemplateType) {
  const { announcementText, inviteUrl, verifyEmailLink, announcementUrl, taskTitle, panelName, domainName } = args

  switch (format) {
    case (Format.JOIN_DOMAIN):
      return (
        `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #635fc7;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>
        <p>Hi ${name},</p>

        <p>
          You’ve successfully joined the domain ${domainName} on Kreed. Start collaborating with your teammates, track tasks, and manage your panels to stay on top of your work.

Let us know if you need any assistance getting started!
        </p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
<p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>
        </div>
    </div>
</body>
</html>
`
      );
    case (Format.DELETION_OF_TASK):
      return (
        `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>

        <h1>Task Deleted: ${taskTitle}</h1>

        <p>Hi ${name},</p>

        <p>
            We wanted to inform you that the task titled "<strong>${taskTitle}</strong>" 
            you were assigned to in the <strong>${panelName}</strong> panel under the 
            <strong>${domainName}</strong> domain has been deleted by an admin.
        </p>

        <p>
            If this was unexpected, or you have any questions regarding the deletion, 
            feel free to reach out to your domain admin.
        </p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
            <p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>
        </div>
    </div>
</body>
</html>
`
      );
    case (Format.VERIFYING_EMAIL):
      return (
        `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #635fc7;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>
        <p>Hi ${name},</p>

        <p>Welcome to Kreed! We're excited to have you on board. To get started, please verify your email address by clicking the button below:</p>

        <a href=${verifyEmailLink} class="button">Verify Email</a>

        <p>If the button doesn't work, you can also verify your email by copying and pasting the link below into your browser:</p>
        <p><a href=${verifyEmailLink}>${verifyEmailLink}</a></p>

        <p>Thank you for joining Kreed. We're looking forward to helping you unlock the power of collaboration!</p>

        <p>If you didn't sign up for Kreed, please ignore this email.</p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
            <p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>
        </div>
    </div>
</body>
</html>
`
      );

    case (Format.LEAVE_DOMAIN):
      return (
        `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #635fc7;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>
        <p>Hi ${name},</p>

        <p>
You’ve successfully left the domain ${domainName}. You will no longer have access to tasks or panels within this domain.

If you left by mistake or need to rejoin, please contact the domain admin.
        </p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
<p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>
        </div>
    </div>
</body>
</html>
`
      )
    case (Format.REMOVED_DOMAIN):
      return (
        `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #635fc7;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>
        <p>Hi ${name},</p>

        <p>
You have been removed from the domain ${domainName}. You no longer have access to any tasks, panels, or collaborators in this domain.

If you believe this was an error, please contact the domain admin.        </p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
<p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>
        </div>
    </div>
</body>
</html>
`
      )
    case (Format.INVITED_TO_PANEL):
      return (
        `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #635fc7;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>
        <p>Hi ${name},</p>

        <p>
You’ve been invited to join the ${panelName} panel within the ${domainName} domain on Kreed. Get started by accepting the invitation and collaborating with your team.

You can start assigning tasks, tracking progress, and staying organized.        </p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
<p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>
        </div>
    </div>
</body>
</html>
`
      );
    case (Format.REMOVED_FROM_PANEL):
      return (
        `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #635fc7;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>
        <p>Hi ${name},</p>

        <p>
You’ve been removed from the ${panelName} panel within the ${domainName} domain. You will no longer have access to the tasks and progress in this panel.

If you have any questions or believe this was a mistake, feel free to contact the panel admin.        </p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
<p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>
        </div>
    </div>
</body>
</html>
`
      )
    case (Format.ASSIGNED_TO_TASK):
      return (
        `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #635fc7;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>
        <p>Hi ${name},</p>

        <p>
You’ve been assigned a new task titled “${taskTitle}” in the ${panelName} panel within the ${domainName} domain. Stay organized and on track by completing your task within the timeline set.

You can view and manage your tasks by logging into Kreed.
        </p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
<p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>
        </div>
    </div>
</body>
</html>
`
      );
    case (Format.REMOVED_FROM_TASK):
      return (
        `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #635fc7;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>
        <p>Hi ${name},</p>

        <p>
You’ve been removed from the task titled “${taskTitle}” in the ${panelName} panel. You no longer need to worry about completing this task.

If you think this was a mistake, please reach out to your panel admin.
        </p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
<p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>
        </div>
    </div>
</body>
</html>
`
      );
    case (Format.MENTIONED_ON_CHAT):
      return (
        `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .announcement-text {
            font-style: italic;
            margin: 20px 0;
            background-color: #f9f9f9;
            padding: 10px;
            border-left: 4px solid #007bff;
        }
        .button {
            text-align: center;
            margin-top: 20px;
        }
        .button a {
            background-color: #635fc7;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 14px;
            color: #555;
        }
        .footer small {
            display: block;
            margin-top: 10px;
            color: #777;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>
        <p>Hi ${name},</p>

        <p>You were mentioned in an announcement in the <strong>${domainName}</strong> domain. The message is as follows:</p>

        <div class="announcement-text">
            "${announcementText}"
        </div>

        <div class="button">
            <a href="${announcementUrl}" target="_blank">View Announcement</a>
        </div>

        <p>We hope this keeps you updated on important domain announcements.</p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
<p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>

        </div>
    </div>
</body>
</html>
`
      )
    case (Format.GETTING_PROMOTED):
      return (`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Promotion Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .button {
            text-align: center;
            margin-top: 20px;
        }
        .button a {
            background-color: #635fc7;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 14px;
            color: #555;
        }
        .footer small {
            display: block;
            margin-top: 10px;
            color: #777;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>

        <p>Hi ${name},</p>

        <p>Congratulations! You’ve been promoted to Admin in the <strong>${domainName}</strong> domain. As an admin, you now have more privileges, including the ability to manage users and panels.</p>

        <p>Explore your new permissions:</p>

        <div class="button">
            <a href="https://app.kreed.tech" target="_blank">View Domain</a>
        </div>

        <p>We’re excited to see your leadership in action!</p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
<p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>

        </div>
    </div>
</body>
</html>
`);
    case (Format.INVITED_TO_DOMAIN):
      return (
        `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .button {
            text-decoration: none;
            display: inline-block;
            background-color: #635fc7;
            color: #fff;
            padding: 10px 20px;
            border-radius: 4px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>
        <p>Hi ${name},</p>

        <p>
You have been invited to join the domain "${domainName}", where they excel in their field. To become a part of this community, please create an account before joining.
        </p>
        
        <p>Click the button below to join the domain:</p>
        
        <div class="button">        
          <a href=${inviteUrl} target="_blank">Join Domain</a>
        </div>

        <p>If the button doesn't work, you can also join the domain by copying and pasting the link below into your browser:</p>

        <a href=${inviteUrl} target="_blank">Go to Link</a>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
            <p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>
        </div>
    </div>
</body>
</html>
`
      );
    case (Format.GETTING_DEMOTED):
      return (
        `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px;
        }
        .header img {
            max-width: 100px;
        }
        h1 {
            color: #333;
        }
        p {
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #635fc7;
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Kreed Logo">
        </div>
        <p>Hi ${name},</p>

        <p>
You have been demoted to a member role in the ${domainName} domain by an admin. As a member, you will retain access to panels and tasks, but certain admin privileges have been removed.

If you have questions, please contact your domain admin.
        </p>

        <p>Best regards,<br>The Kreed Team</p>

        <div class="footer">
<p>Want to learn more about Kreed and how to make the most of it?</p>
            <p class="social-links">
                Check out our <a href="https://www.youtube.com/channel/UCpBOpGURgojgh1RQUsyCUtw" target="_blank">YouTube channel</a>, 
                follow us on <a href="https://x.com/KreedTech" target="_blank">Twitter</a>, 
                or visit our <a href="https://kreed.tech" target="_blank">Landing page</a> 
                for the latest updates, tutorials, and community engagement.
            </p>

            <small>© 2024 Kreed, All Rights Reserved.</small>
        </div>
    </div>
</body>
</html>
`
      );
    default:
      break;

  }
}

export function getEmailSubject(format: Format, args: GetEmailSubjectType) {
  const { domainName, panelName, taskTitle } = args
  switch (format) {
    case (Format.JOIN_DOMAIN):
      return `You've Joined the ${domainName} Domain`
    case (Format.LEAVE_DOMAIN):
      return `You've Left the ${domainName} Domain`
    case (Format.REMOVED_DOMAIN):
      return `You've Been Removed from ${domainName}`
    case (Format.INVITED_TO_PANEL):
      return `You've Been Invited to the ${panelName} Panel`
    case (Format.REMOVED_FROM_PANEL):
      return `You've Been Removed from the ${panelName} Panel`
    case (Format.ASSIGNED_TO_TASK):
      return `You've Been Assigned a New Task in ${panelName}`
    case (Format.REMOVED_FROM_TASK):
      return `You've Been Removed from Task ${taskTitle}`
    case (Format.MENTIONED_ON_CHAT):
      return `You Were Mentioned in an Announcement`
    case (Format.INVITED_TO_DOMAIN):
      return `You're Invited to Join the ${domainName} Domain on Kreed`
    case (Format.GETTING_PROMOTED):
      return `You've Been Promoted to Admin on ${domainName}`
    case (Format.GETTING_DEMOTED):
      return `You've Been Demoted to Member on ${domainName}`
    case (Format.DELETION_OF_TASK):
      return `Task Deleted: ${taskTitle}`
    case (Format.VERIFYING_EMAIL):
      return `Verify your email address`
    default:
      break;
  }
}
