const sleepFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const service = ({logger, makeService}) => {
  const svc = makeService({path: '/warm-transfer'});

  svc.on('session:new', async(session) => {
    session.locals = {logger: logger.child({call_sid: session.call_sid})};
    logger.info({session}, `new incoming call: ${session.call_sid}`);

    const conversation_summary = 'John Doe is a 35-year old male interesting in life insurance plans...';
    try {
      session
        .on('close', onClose.bind(null, session))
        .on('error', onError.bind(null, session));

      session
      .say({text: 'Please hold while we connect you to an agent.'})
      .enqueue({
        name: session.call_sid,
        actionHook: '/consultationDone'
      })
      .hangup()
      .send();

      await sleepFor(2000); // simulate some processing time
    
      /* dial the agent */
      session.sendCommand('dial', {
        call_hook: '/dial-agent',
        from: process.env.FROM_NUMBER || '15083728299',
        to: {
          type: 'phone',
          number: process.env.AGENT_NUMBER || '15083084809'
        },
        tag: {
          conversation_summary,
          queue: session.call_sid
        },
        speech_synthesis_vendor: 'google',
        speech_synthesis_language: 'en-US',
        speech_synthesis_voice: 'en-US-Wavenet-C',
        speech_recognizer_vendor: 'deepgram',
        speech_recognizer_language: 'en-US'
    });

    } catch (err) {
      session.locals.logger.info({err}, `Error to responding to incoming call: ${session.call_sid}`);
      session.close();
    }
  });
};

const onClose = (session, code, reason) => {
  const {logger} = session.locals;
  logger.info({session, code, reason}, `session ${session.call_sid} closed`);
};

const onError = (session, err) => {
  const {logger} = session.locals;
  logger.info({err}, `session ${session.call_sid} received error`);
};

module.exports = service;
