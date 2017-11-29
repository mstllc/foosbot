module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : 'foosbot',
      script    : 'index.js',
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_production : {
        NODE_ENV: 'production'
      }
    }
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      user : 'mst',
      host : 'mst.mn',
      ref  : 'origin/master',
      repo : 'git@github.com:thorsonmscott/foosbot.git',
      path : '/home/mst/foosbot',
      'post-deploy' : 'yarn install && pm2 reload ecosystem.config.js --env production --update-env'
    }
  }
};
