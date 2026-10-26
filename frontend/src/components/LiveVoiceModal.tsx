import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Sparkles,
  MessageSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { sendChatMessage, recordVoiceMinutes } from '../services/api';
import { UserSettings } from '../types';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
  settings: UserSettings | null;
  onMessageSent: (reply: string, correction: any) => void;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  settings,
  onMessageSent,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [sessionTranscript, setSessionTranscript] = useState<
    { sender: 'user' | 'assistant'; text: string; time: string }[]
  >([]);
  const [lastAssistantReply, setLastAssistantReply] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [sessionStartTime] = useState<number>(Date.now());

  const {
    isListening,
    transcript,
    interimTranscript,
    durationSeconds,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();

  // Ref to hold the latest transcript for silence detection
  const transcriptTimeoutRef = useRef<any>(null);

  // When modal opens, greet and start listening
  useEffect(() => {
    if (isOpen) {
      setVoiceState('listening');
      startListening();
    } else {
      stopListening();
      stopSpeaking();
      // Record elapsed minutes to stats
      const elapsedMin = (Date.now() - sessionStartTime) / 60000;
      if (elapsedMin > 0.1) {
        recordVoiceMinutes(elapsedMin).catch(console.error);
      }
    }
  }, [isOpen]);

  // Turn-taking logic: detect when user has finished speaking
  useEffect(() => {
    if (isListening && transcript.trim()) {
      clearTimeout(transcriptTimeoutRef.current);
      // Wait for 1.8 seconds of silence before finalizing user's turn
      transcriptTimeoutRef.current = setTimeout(() => {
        handleUserTurnFinished(transcript.trim());
      }, 1800);
    }
    return () => clearTimeout(transcriptTimeoutRef.current);
  }, [transcript, isListening]);

  const handleUserTurnFinished = async (userText: string) => {
    stopListening();
    resetTranscript();
    setVoiceState('thinking');

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSessionTranscript((prev) => [...prev, { sender: 'user', text: userText, time: nowStr }]);

    try {
      const res = await sendChatMessage({
        conversation_id: conversationId || undefined,
        message: userText,
        audio_duration_seconds: durationSeconds || 5,
      });

      const reply = res.reply;
      setLastAssistantReply(reply);
      setSessionTranscript((prev) => [...prev, { sender: 'assistant', text: reply, time: nowStr }]);
      onMessageSent(reply, res.correction);

      // Start speaking the response
      if (!isMuted) {
        setVoiceState('speaking');
        speak(reply, settings?.voice_speed || 1.0, () => {
          // Finished speaking: turn back to user listening
          setVoiceState('listening');
          startListening();
        });
      } else {
        setVoiceState('listening');
        startListening();
      }
    } catch (e) {
      console.error(e);
      setVoiceState('idle');
    }
  };

  const handleInterrupt = () => {
    stopSpeaking();
    setVoiceState('listening');
    startListening();
  };

  const handleReplay = () => {
    if (lastAssistantReply) {
      stopListening();
      setVoiceState('speaking');
      speak(lastAssistantReply, settings?.voice_speed || 1.0, () => {
        setVoiceState('listening');
        startListening();
      });
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    if (!isMuted && isSpeaking) {
      stopSpeaking();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 shadow-2xl flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">FluentUp Voice Companion</div>
              <div className="text-[11px] text-slate-400">Live Turn-Taking with Maya</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowTranscript((prev) => !prev)}
              title="Toggle Live Transcript"
              className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-colors ${
                showTranscript ? 'bg-slate-800 text-brand-400' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Animated Orb */}
        <div className="my-10 flex flex-col items-center justify-center relative">
          {/* Status Label */}
          <div className="text-xs font-medium tracking-wide uppercase mb-6 px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50">
            {voiceState === 'listening' && 'Listening to you...'}
            {voiceState === 'thinking' && 'Maya is thinking...'}
            {voiceState === 'speaking' && 'Maya is speaking...'}
            {voiceState === 'idle' && 'Tap mic to start'}
          </div>

          {/* Orb Animation */}
          <div className="relative flex items-center justify-center">
            {/* Ambient halo */}
            <div
              className={`absolute w-44 h-44 rounded-full transition-all duration-700 blur-2xl opacity-40 ${
                voiceState === 'speaking'
                  ? 'bg-purple-600 scale-125'
                  : voiceState === 'listening'
                  ? 'bg-brand-500 scale-110'
                  : voiceState === 'thinking'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-slate-700 scale-90'
              }`}
            />

            {/* Core Orb */}
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                voiceState === 'speaking'
                  ? 'bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-500 animate-voice-glow'
                  : voiceState === 'listening'
                  ? 'bg-gradient-to-tr from-brand-500 to-cyan-500 scale-105'
                  : voiceState === 'thinking'
                  ? 'bg-gradient-to-tr from-indigo-700 to-amber-600 animate-spin'
                  : 'bg-slate-800 border-2 border-slate-700'
              }`}
            >
              {/* Sound waves frequency simulation */}
              <div className="flex items-center gap-1.5 h-10">
                <span
                  className={`w-1 bg-white rounded-full transition-all ${
                    voiceState === 'speaking' || voiceState === 'listening'
                      ? 'animate-soundwave'
                      : 'h-2'
                  }`}
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className={`w-1 bg-white rounded-full transition-all ${
                    voiceState === 'speaking' || voiceState === 'listening'
                      ? 'animate-soundwave'
                      : 'h-4'
                  }`}
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className={`w-1 bg-white rounded-full transition-all ${
                    voiceState === 'speaking' || voiceState === 'listening'
                      ? 'animate-soundwave'
                      : 'h-6'
                  }`}
                  style={{ animationDelay: '300ms' }}
                />
                <span
                  className={`w-1 bg-white rounded-full transition-all ${
                    voiceState === 'speaking' || voiceState === 'listening'
                      ? 'animate-soundwave'
                      : 'h-3'
                  }`}
                  style={{ animationDelay: '200ms' }}
                />
              </div>
            </div>
          </div>

          {/* Current Live Speech display */}
          <div className="mt-8 px-4 text-center max-w-sm min-h-[44px]">
            {voiceState === 'listening' && (
              <p className="text-sm text-slate-300 italic">
                {transcript || interimTranscript || 'Start speaking naturally...'}
              </p>
            )}
            {voiceState === 'speaking' && (
              <p className="text-sm text-brand-200 line-clamp-2">
                "{lastAssistantReply}"
              </p>
            )}
            {voiceState === 'thinking' && (
              <p className="text-sm text-slate-400">Processing your response...</p>
            )}
            {speechError && (
              <p className="text-xs text-rose-400 flex items-center justify-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {speechError}
              </p>
            )}
          </div>
        </div>

        {/* Live Transcript Drawer */}
        {showTranscript && (
          <div className="w-full max-h-40 overflow-y-auto bg-slate-950/80 rounded-2xl p-3 border border-slate-800 text-xs space-y-2 mb-4 scrollbar-thin">
            {sessionTranscript.length === 0 ? (
              <div className="text-slate-500 text-center py-4">No speech recorded yet.</div>
            ) : (
              sessionTranscript.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl ${
                    item.sender === 'user' ? 'bg-slate-800/80 text-white' : 'bg-brand-950/50 text-brand-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className="font-semibold uppercase">{item.sender === 'user' ? 'You' : 'Maya'}</span>
                    <span>{item.time}</span>
                  </div>
                  <div>{item.text}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Bottom Voice Controls */}
        <div className="w-full flex items-center justify-center gap-3 pt-2">
          {/* Interrupt / Stop speaking button */}
          {voiceState === 'speaking' && (
            <button
              onClick={handleInterrupt}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Interrupt</span>
            </button>
          )}

          {/* Replay Last Reply */}
          {lastAssistantReply && voiceState !== 'speaking' && (
            <button
              onClick={handleReplay}
              title="Replay tutor's last response"
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}

          {/* Microphone Mute / Unmute */}
          <button
            onClick={() => {
              if (isListening) {
                stopListening();
                setVoiceState('idle');
              } else {
                startListening();
                setVoiceState('listening');
              }
            }}
            className={`p-4 rounded-2xl transition-all shadow-lg ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/30'
            }`}
          >
            {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Tutor Audio Mute / Unmute */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute tutor audio' : 'Mute tutor audio'}
            className={`p-3 rounded-2xl transition-colors ${
              isMuted ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        <div className="text-[11px] text-slate-500 mt-4 text-center">
          Speak in natural English. Maya automatically detects pauses and responds.
        </div>
      </div>
    </div>
  );
};
