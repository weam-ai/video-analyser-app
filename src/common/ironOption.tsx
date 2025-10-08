import { SESSION } from './config';

const ironOption = {
    cookieName: SESSION.COOKIE_NAME,
    password: SESSION.COOKIE_PASSWORD,
    cookieOptions: {
        httpOnly: true,
        secure: false,
    },
};

export default ironOption;
