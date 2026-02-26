import React from 'react';
import './Styles/ClientVideoVerificationForm.css';

const ClientVideoVerificationForm = ({ onNext, onPrevious }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) onNext({});
  };

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
          <button
            type="button"
            className="cp-video-demo-btn"
          >
            <span className="cp-video-demo-icon">
              <svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
                <path d="M4 4.75A2.75 2.75 0 016.75 2h6.5A2.75 2.75 0 0116 4.75v10.5A2.75 2.75 0 0113.25 18h-6.5A2.75 2.75 0 014 15.25V4.75zm4.5.5a.75.75 0 00-1.125-.64l-2.5 1.5a.75.75 0 000 1.28l2.5 1.5A.75.75 0 008.5 8.25v-3z" />
              </svg>
            </span>
          </button>
        </div>

        <form className="cp-signup-form cp-video-form" onSubmit={handleSubmit}>
          <div className="cp-video-layout">
            <div className="cp-video-steps">
              {/* Step 1 */}
              <div className="cp-video-step">
                <div className="cp-video-step-media cp-video-step-media-1" />
                <div className="cp-video-step-content">
                  <h3>
                    Start by making sure that your webcam and mic are working properly.
                  </h3>
                  <p>
                    You will have to show your documents and face clearly to the camera
                    and follow the instructions on screen within 40 seconds, so make
                    sure everything is working.
                  </p>
                  <button type="button" className="cp-video-link">
                    Test your webcam and microphone
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="cp-video-step">
                <div className="cp-video-step-media cp-video-step-media-2" />
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
                <div className="cp-video-step-media cp-video-step-media-3" />
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
                <div className="cp-video-step-media cp-video-step-media-4" />
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
          </div>

          <div className="cp-form-actions cp-video-actions">
            <button
              type="button"
              className="cp-previous-btn"
              onClick={onPrevious}
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
                className="cp-video-start-btn"
              >
                Start Recording
              </button>
              <button type="submit" className="cp-next-btn">
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

