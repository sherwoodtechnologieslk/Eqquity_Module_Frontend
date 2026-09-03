import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Styles/ClientVideoVerificationForm.css';

const MAX_RECORDING_SECONDS = 40;
const CODE_APPEAR_AT = 30;

const generateVerificationCode = () =>
  String(Math.floor(1000 + Math.random() * 9000));

const ClientVideoVerificationForm = ({ onNext, onPrevious }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState('idle');
  const [testError, setTestError] = useState('');
  const [micLevel, setMicLevel] = useState(0);

  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recordedBlob, setRecordedBlob] = useState(null);

  const videoRef = useRef(null);
  const recordVideoRef = useRef(null);
  const streamRef = useRef(null);
  const recordStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const stopMediaTest = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setMicLevel(0);
  }, []);

  const stopRecordingStream = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    if (recordStreamRef.current) {
      recordStreamRef.current.getTracks().forEach((track) => track.stop());
      recordStreamRef.current = null;
    }

    if (recordVideoRef.current) {
      recordVideoRef.current.srcObject = null;
    }
  }, []);

  const handleStopTest = useCallback(() => {
    stopMediaTest();
    setIsTesting(false);
    setTestStatus('idle');
    setTestError('');
  }, [stopMediaTest]);

  const finalizeRecording = useCallback((blob) => {
    stopRecordingStream();
    setRecordedBlob(blob);
    setRecordingStatus('stopped');
  }, [stopRecordingStream]);

  const stopActiveRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      return;
    }
    stopRecordingStream();
    setRecordingStatus('idle');
    setRecordingSeconds(0);
  }, [stopRecordingStream]);

  const handleTestMedia = useCallback(async () => {
    if (isTesting) {
      handleStopTest();
      return;
    }

    if (recordingStatus === 'recording') {
      return;
    }

    setIsTesting(true);
    setTestStatus('loading');
    setTestError('');
    stopMediaTest();

    if (!navigator.mediaDevices?.getUserMedia) {
      setTestStatus('error');
      setTestError('Your browser does not support camera or microphone access.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const updateMicLevel = () => {
        analyser.getByteFrequencyData(data);
        const peak = data.reduce((max, value) => Math.max(max, value), 0);
        setMicLevel(Math.min(100, Math.round((peak / 255) * 120)));
        animationFrameRef.current = requestAnimationFrame(updateMicLevel);
      };
      updateMicLevel();

      setTestStatus('success');
    } catch (error) {
      stopMediaTest();
      setTestStatus('error');

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setTestError('Camera or microphone access was denied. Allow permissions and try again.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setTestError('No camera or microphone was found on this device.');
      } else {
        setTestError('Unable to access your camera or microphone. Please check your device settings.');
      }
    }
  }, [handleStopTest, isTesting, recordingStatus, stopMediaTest]);

  const handleStartRecording = useCallback(async () => {
    if (recordingStatus === 'recording') {
      stopActiveRecording();
      return;
    }

    if (recordingStatus === 'starting') {
      return;
    }

    handleStopTest();
    stopRecordingStream();
    setRecordedBlob(null);
    setRecordingError('');
    setRecordingSeconds(0);
    setRecordingStatus('starting');

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingStatus('error');
      setRecordingError('Video recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });

      recordStreamRef.current = stream;
      const code = generateVerificationCode();
      setVerificationCode(code);

      if (recordVideoRef.current) {
        recordVideoRef.current.srcObject = stream;
        await recordVideoRef.current.play();
      }

      recordingChunksRef.current = [];
      const preferredTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, {
          type: recorder.mimeType || 'video/webm',
        });
        recordingChunksRef.current = [];
        finalizeRecording(blob);
      };

      recorder.start(250);
      setRecordingStatus('recording');

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= MAX_RECORDING_SECONDS) {
            return prev;
          }

          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS && mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          return next;
        });
      }, 1000);
    } catch (error) {
      stopRecordingStream();
      setRecordingStatus('error');

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setRecordingError('Camera or microphone access was denied. Allow permissions and try again.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setRecordingError('No camera or microphone was found on this device.');
      } else {
        setRecordingError('Unable to start recording. Please check your device settings.');
      }
    }
  }, [
    finalizeRecording,
    handleStopTest,
    recordingStatus,
    stopActiveRecording,
    stopRecordingStream,
  ]);

  useEffect(
    () => () => {
      stopMediaTest();
      stopRecordingStream();
    },
    [stopMediaTest, stopRecordingStream],
  );

  const formattedTimer = useMemo(() => {
    const minutes = Math.floor(recordingSeconds / 60);
    const seconds = recordingSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [recordingSeconds]);

  const showVerificationCode =
    recordingStatus === 'recording' && recordingSeconds >= CODE_APPEAR_AT;

  const handleSubmit = (e) => {
    e.preventDefault();
    stopMediaTest();
    stopRecordingStream();

    if (onNext) {
      onNext({
        videoVerificationComplete: Boolean(recordedBlob),
        videoVerificationCode: verificationCode,
        videoRecordingDuration: recordingSeconds,
        videoRecordingBlob: recordedBlob,
      });
    }
  };

  const isRecordingActive = recordingStatus === 'recording' || recordingStatus === 'starting';
  const startButtonLabel =
    recordingStatus === 'recording'
      ? 'Stop Recording'
      : recordingStatus === 'stopped'
        ? 'Record Again'
        : 'Start Recording';

  return (
    <div className="cp-signup-form-container">
      <div className="cp-signup-form-wrapper">
        <div className="cp-signup-form-header cp-video-header">
          <div className="cp-video-header-main">
            <h1>Easy Video Verification</h1>
            <p>
              Follow the simple instructions below to complete the video verification
              successfully!
            </p>
          </div>
        </div>

        <form className="cp-signup-form cp-video-form" onSubmit={handleSubmit}>
          <div className="cp-video-layout">
            <div className="cp-video-steps">
              {/* Step 1 */}
              <div className="cp-video-step">
                <span className="cp-video-step-icon" aria-hidden="true">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm11.5 3.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <div className="cp-video-step-content">
                  <h3>
                    Start by making sure that your webcam and mic are working properly.
                  </h3>
                  <p>
                    You will have to show your documents and face clearly to the camera
                    and follow the instructions on screen within 40 seconds, so make
                    sure everything is working.
                  </p>
                  <button
                    type="button"
                    className="cp-video-link"
                    onClick={handleTestMedia}
                    disabled={isRecordingActive}
                  >
                    {isTesting ? 'Stop test' : 'Test your webcam and microphone'}
                  </button>
                </div>

                {isTesting && (
                  <div className="cp-video-test-panel">
                    <div className="cp-video-test-preview-wrap">
                      <video
                        ref={videoRef}
                        className="cp-video-test-preview"
                        playsInline
                        muted
                        autoPlay
                      />
                      {testStatus === 'loading' && (
                        <p className="cp-video-test-overlay">Requesting access…</p>
                      )}
                    </div>

                    {testStatus === 'success' && (
                      <div className="cp-video-test-status cp-video-test-status--ok">
                        <p>Camera and microphone are connected.</p>
                        <div className="cp-video-mic-meter">
                          <span className="cp-video-mic-label">Microphone level</span>
                          <div className="cp-video-mic-track">
                            <div
                              className="cp-video-mic-fill"
                              style={{ width: `${Math.max(micLevel, 4)}%` }}
                            />
                          </div>
                          <span className="cp-video-mic-hint">Speak to confirm your mic is working.</span>
                        </div>
                      </div>
                    )}

                    {testStatus === 'error' && (
                      <div className="cp-video-test-status cp-video-test-status--error">
                        <p>{testError}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2 */}
              <div className="cp-video-step">
                <span className="cp-video-step-icon" aria-hidden="true">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <div className="cp-video-step-content">
                  <h3>
                    Have your NIC and Address/Billing Proof ready, and make sure the area
                    is well lit.
                  </h3>
                  <p>
                    If you don&apos;t have a document as physical proof, you can show
                    your Digital Bank Statement on screen during the verification.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="cp-video-step">
                <span className="cp-video-step-icon" aria-hidden="true">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <div className="cp-video-step-content">
                  <h3>Click &apos;Start&apos; and follow the on-screen instructions.</h3>
                  <p>
                    Once you click start and the recording begins, you&apos;ll need to
                    show both sides of your NIC, your Address/Billing proof (if
                    available), state your name, NIC number, and click &apos;Next&apos;
                    within 30 seconds.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="cp-video-step">
                <span className="cp-video-step-icon" aria-hidden="true">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <div className="cp-video-step-content">
                  <h3>
                    Read out the randomly generated number below the video (within 10
                    seconds).
                  </h3>
                  <p>
                    In the last 10 seconds of the video recording, please read out the
                    randomly generated number that appears under the video screen and
                    click &apos;Submit&apos;.
                  </p>
                </div>
              </div>
            </div>

            {(isRecordingActive || recordingStatus === 'stopped' || recordingStatus === 'error') && (
              <div className="cp-video-record-panel">
                <div className="cp-video-record-preview-wrap">
                  <video
                    ref={recordVideoRef}
                    className="cp-video-record-preview"
                    playsInline
                    muted
                    autoPlay
                  />
                  {recordingStatus === 'starting' && (
                    <p className="cp-video-test-overlay">Starting camera…</p>
                  )}
                  {recordingStatus === 'recording' && (
                    <div className="cp-video-record-badge">
                      <span className="cp-video-record-dot" />
                      REC {formattedTimer}
                    </div>
                  )}
                </div>

                {showVerificationCode && (
                  <div className="cp-video-code-box">
                    <span className="cp-video-code-label">Read this number aloud</span>
                    <span className="cp-video-code-value">{verificationCode}</span>
                  </div>
                )}

                {recordingStatus === 'stopped' && (
                  <div className="cp-video-test-status cp-video-test-status--ok">
                    <p>Recording saved ({formattedTimer}). You can continue to the next step.</p>
                  </div>
                )}

                {recordingStatus === 'error' && (
                  <div className="cp-video-test-status cp-video-test-status--error">
                    <p>{recordingError}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="cp-form-actions cp-video-actions">
            <button
              type="button"
              className="cp-previous-btn"
              onClick={onPrevious}
              disabled={isRecordingActive}
            >
              <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Previous
            </button>
            <div className="cp-video-primary-actions">
              <button
                type="button"
                className={`cp-video-start-btn${recordingStatus === 'recording' ? ' cp-video-start-btn--stop' : ''}`}
                onClick={handleStartRecording}
                disabled={recordingStatus === 'starting'}
              >
                {recordingStatus === 'starting' ? 'Starting…' : startButtonLabel}
              </button>
              <button type="submit" className="cp-next-btn" disabled={isRecordingActive}>
                Next
                <svg fill="currentColor" viewBox="0 0 20 20" width="20" height="20">
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientVideoVerificationForm;
