import * as env from 'env-var';
import './dotenv';

export const config = {
     service: {
        port: env.get('PORT').default(6000).asPortNumber(),
        systemUnavailableURL: env.get('SYSTEM_UNAVAILABLE_URL').default('/unavailable').required().asString(),
        defaultLimit: env.get('DEFAULT_LIMIT').asIntPositive(),
        requestTimeout: env.get('REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    // mongo: {
    //     uri: env.get('MONGO_URI').required().asString(),
    //     userCollectionName: env.get('USERS_COLLECTION_NAME').default('users').asString(),
    // },
    users: {
        baseRoute: env.get('USERS_BASE_ROUTE').default('/api/users').asString(),
    },
    driveways: {
         baseRoute: '/api/driveways'
    }
}