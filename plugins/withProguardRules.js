const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withCustomProguardRules = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const { platformProjectRoot } = config.modRequest;
            const proguardPath = path.join(platformProjectRoot, 'app', 'proguard-rules.pro');

            let contents = '';
            if (fs.existsSync(proguardPath)) {
                contents = fs.readFileSync(proguardPath, 'utf8');
            }

            const newRules = `
# Custom Rules for Google Sign-In
-keep class co.apptailor.googlesignin.** { *; }
-keep class com.google.android.gms.** { *; }
`;

            if (!contents.includes('co.apptailor.googlesignin')) {
                fs.writeFileSync(proguardPath, contents + newRules);
            }

            return config;
        },
    ]);
};

module.exports = withCustomProguardRules;
