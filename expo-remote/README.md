# Prayer Display Remote Controller

A React Native Expo application to remotely control and configure the Prayer Display application.

## Features

- 🔍 Automatically discover prayer displays on your local network
- 🔄 Connect to and control prayer displays remotely
- ⏱️ Adjust prayer times and iqamah time offsets
- 📱 Built with Expo for cross-platform compatibility
- 🔒 Biometric authentication for secure access

## Installation

1. Clone the repository or navigate to the expo-remote directory:
```sh
cd /path/to/AnNajashi/expo-remote
```

2. Install dependencies:
```sh
npm install
```

3. Start the Expo development server:
```sh
npx expo start
```

4. Use Expo Go app on your mobile device to scan the QR code or run on an emulator.

## Usage

1. Launch the app on your mobile device
2. Authenticate using biometrics (if enabled)
3. Use the "Network Discovery" feature to automatically find prayer displays on your network
4. Or manually enter the IP address and port of your prayer display (e.g., 192.168.1.100:3000)
5. Once connected, adjust prayer time settings and iqamah offsets
6. Save changes to update the connected prayer display

## Security

The remote app uses local biometric authentication when available to prevent unauthorized access to your prayer display settings. All communication happens over your local network.

## Troubleshooting

- Ensure your mobile device is on the same network as your prayer display
- Check that the prayer display app is running and has WebSocket server enabled
- If you can't connect manually, check the IP address and port are correct
- Restart the prayer display app if persistent connection issues occur

## License

See the main project repository for license information. 