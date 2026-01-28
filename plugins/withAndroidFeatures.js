const { withAndroidManifest } = require('@expo/config-plugins');

const withAndroidFeatures = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;

        if (!androidManifest.manifest['uses-feature']) {
            androidManifest.manifest['uses-feature'] = [];
        }

        // Add microphone as optional (implied by RECORD_AUDIO)
        addFeature(androidManifest, 'android.hardware.microphone', false);

        // Add camera as optional (implied by camera permissions if present)
        addFeature(androidManifest, 'android.hardware.camera', false);
        addFeature(androidManifest, 'android.hardware.camera.autofocus', false);

        // Add telephony as optional (often implied but not always needed)
        addFeature(androidManifest, 'android.hardware.telephony', false);

        return config;
    });
};

function addFeature(androidManifest, name, required) {
    const features = androidManifest.manifest['uses-feature'];

    // Check if it already exists
    const existing = features.find(f => f.$['android:name'] === name);

    if (existing) {
        existing.$['android:required'] = String(required);
    } else {
        features.push({
            $: {
                'android:name': name,
                'android:required': String(required),
            },
        });
    }
}

module.exports = withAndroidFeatures;
