// Video Call Management using Jitsi Meet API
let jitsiApi = null;

// DOM elements
const startCallBtn = document.getElementById('startCallBtn');
const displayNameInput = document.getElementById('displayName');
const roomNameInput = document.getElementById('roomName');
const waitingScreen = document.getElementById('waitingScreen');
const meetContainer = document.getElementById('meetContainer');

// Device detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Set event listeners
    if (startCallBtn) {
        startCallBtn.addEventListener('click', startVideoCall);
    }
    
    // Pre-fill display name if user is logged in
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        try {
            // Try to get username from JWT token
            const tokenData = JSON.parse(atob(accessToken.split('.')[1]));
            if (tokenData && tokenData.sub && displayNameInput) {
                displayNameInput.value = tokenData.sub;
            }
        } catch (e) {
            console.error('Error parsing token:', e);
        }
    }

    // Show mobile-specific instructions
    if (isMobile) {
        const videoCallArea = document.querySelector('.video-call-area');
        if (videoCallArea) {
            const mobileNotice = document.createElement('div');
            mobileNotice.className = 'mobile-notice';
            mobileNotice.innerHTML = '<p><i class="fas fa-mobile-alt"></i> For the best experience, use your device in landscape orientation.</p>';
            videoCallArea.prepend(mobileNotice);
        }
    }
});

/**
 * Starts a video call using Jitsi Meet API
 */
function startVideoCall() {
    // Validate display name
    const displayName = displayNameInput.value.trim();
    if (!displayName) {
        alert('Please enter your name before starting the call');
        displayNameInput.focus();
        return;
    }
    
    // Get room name
    const roomName = roomNameInput.value.trim();
    if (!roomName) {
        alert('Room name is required');
        return;
    }
    
    // Show the meet container and hide waiting screen
    if (waitingScreen) waitingScreen.style.display = 'none';
    if (meetContainer) meetContainer.style.display = 'block';
    
    // Initialize Jitsi Meet
    initJitsiMeet(roomName, displayName);
}

/**
 * Initializes the Jitsi Meet API
 * @param {string} roomName - The name of the room to join
 * @param {string} displayName - The display name of the user
 */
function initJitsiMeet(roomName, displayName) {
    // Destroy existing instance if any
    if (jitsiApi) {
        jitsiApi.dispose();
    }
    
    // Jitsi Meet domain
    const domain = 'meet.jit.si';
    
    // Configure options based on device type
    const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: meetContainer,
        userInfo: {
            displayName: displayName
        },
        configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            // Mobile specific configurations
            disableSelfViewSettings: isMobile,
            disablePolls: isMobile,
            resolution: isMobile ? 180 : 720
        },
        interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: isMobile ? 
                ['microphone', 'camera', 'hangup', 'chat', 'raisehand'] :
                [
                    'microphone', 'camera', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat',
                    'settings', 'raisehand', 'videoquality', 'filmstrip',
                    'feedback', 'stats', 'shortcuts'
                ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#f0f9ff',
            DEFAULT_REMOTE_DISPLAY_NAME: 'Healthcare Provider',
            TOOLBAR_ALWAYS_VISIBLE: true,
            // Mobile optimizations
            MOBILE_APP_PROMO: false,
            HIDE_INVITE_MORE_HEADER: isMobile,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: isMobile,
            DISABLE_FOCUS_INDICATOR: isMobile
        }
    };
    
    try {
        // Create Jitsi Meet API instance
        jitsiApi = new JitsiMeetExternalAPI(domain, options);
        
        // Event listeners
        jitsiApi.addListener('videoConferenceJoined', () => {
            console.log('Local user joined the conference');
            
            // Handle orientation change for mobile devices
            if (isMobile) {
                window.addEventListener('orientationchange', () => {
                    setTimeout(() => {
                        jitsiApi.executeCommand('resizeLargeVideo');
                    }, 500);
                });
            }
        });
        
        jitsiApi.addListener('participantJoined', (participant) => {
            console.log('Participant joined:', participant);
        });
        
        jitsiApi.addListener('readyToClose', () => {
            console.log('Call ended');
            disposeJitsiMeet();
        });
        
        jitsiApi.addListener('videoConferenceLeft', () => {
            console.log('Left the conference');
            disposeJitsiMeet();
        });
        
        // Handle hangup button custom behavior
        jitsiApi.addListener('readyToClose', () => {
            handleCallEnd();
        });
        
        // Mobile specific listeners
        if (isMobile) {
            // Add battery saving mode for mobile
            jitsiApi.addEventListener('videoMuteStatusChanged', (muted) => {
                if (muted) {
                    // Lower frame rate when video is muted to save battery
                    jitsiApi.executeCommand('setVideoQuality', 180);
                }
            });
        }
        
    } catch (error) {
        console.error('Failed to initialize Jitsi Meet:', error);
        alert('Failed to start video call. Please try again later.');
        
        // Show waiting screen again
        if (waitingScreen) waitingScreen.style.display = 'flex';
        if (meetContainer) meetContainer.style.display = 'none';
    }
}

/**
 * Cleans up the Jitsi Meet API instance
 */
function disposeJitsiMeet() {
    if (jitsiApi) {
        jitsiApi.dispose();
        jitsiApi = null;
    }
    
    // Show waiting screen again
    if (waitingScreen) waitingScreen.style.display = 'flex';
    if (meetContainer) meetContainer.style.display = 'none';
}

/**
 * Handles the call end event
 */
function handleCallEnd() {
    // Dispose Jitsi Meet
    disposeJitsiMeet();
    
    // Different feedback approach based on device type
    setTimeout(() => {
        if (isMobile) {
            alert('Thank you for using MediEase video consultation service!');
        } else {
            if (confirm('Your consultation has ended. Would you like to provide feedback?')) {
                // Here you could redirect to a feedback form
                // window.location.href = '/feedback';
                alert('Thank you for using MediEase video consultation service!');
            }
        }
    }, 500);
} 