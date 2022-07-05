---
title: Setting up a dev environment on GitLab pages
tags:
  - devops
---
**TL;DR** Preview changes to your GitLab pages by directly accessing job artifacts, without overwriting your pages deployment.

I recently needed to make a few changes to a static site hosted on GitLab pages.
I was looking for a way to deploy a work-in-progress version to a temporary location, without interfering with the production site.
I [found](https://stackoverflow.com/a/58402821){:target="_blank"} a nifty way to do it using CI job artifacts, from a new branch in the same repo.

## Basic pages deploy setup

First, let’s set up the production environment.
We'll add a job named `pages` to our `.gitlab-ci.yml`, which tells GitLab to deploy the contents of the public folder in the master branch after the job succeeds:

```yaml
pages:
  stage: deploy
  artifacts:
    paths:
      - public
  only:
    - master
  script:
    - mkdir .public
    - cp -r * .public
    - mv .public public
```

Since I keep all the files in the repository root, I move them to the public directory in this job &ndash; you might not need to do this.
By limiting this job to master only, we make sure that pushing to any other branch does not overwrite the production deployment.

## “Deploying” a dev branch

GitLab only supports deploying pages from the public folder, but we're already using that for production.
Instead of an actual pages deploy, let’s add a new job that will run on branches other than master.
We’ll save its artifacts, which GitLab makes accessible on a specific URL.
We'll set that URL to an environment named `dev`:

```yaml
dev-deploy:
  stage: deploy
  artifacts:
    paths:
      - public
  except:
    - master
  environment:
    name: dev
    url: 'https://$CI_PROJECT_NAMESPACE.gitlab.io/-/$CI_PROJECT_NAME/-/jobs/$CI_JOB_ID/artifacts/public/index.html'
  script:
    - mkdir .public
    - cp -r * .public
    - mv .public public
```

We define the public folder as an artifact, so that it’s not removed after the job finishes.
After the job succeeds, the dev branch deployment can be found at `https://$CI_PROJECT_NAMESPACE.gitlab.io/-/$CI_PROJECT_NAME/-/jobs/$CI_JOB_ID/` or more conveniently, in the `Operations > Environments` menu, under the `View deployment` button.

### Permissions

By default, only members of the project with access to CI pipelines will have permission to view job artifacts.
This can be changed in `Settings > General`, section `Visibility > Repository > Pipelines`.
If you’d like the dev site to be public, you’ll have to set the visibility of the entire project to public.
