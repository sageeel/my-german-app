import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [view, setView] = useState('list');
  const [words, setWords] = useState([]);
  const [, setLoading] = useState(true);

  // 퀴즈 관련 상태
  const [quizSet, setQuizSet] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null

  const fetchWords = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('words').select('*').order('id', { ascending: false });
    if (error) console.error('Error:', error);
    else setWords(data);
    setLoading(false);
  };

  useEffect(() => { fetchWords(); }, []);

  // --- 퀴즈 로직 시작 ---
  const startQuiz = () => {
    if (words.length < 4) return alert('퀴즈를 위해 최소 4개 이상의 단어가 필요합니다!');
    
    // 1. 단어 셔플 (10문제만 뽑기)
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuizSet(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setView('quiz');
    generateOptions(shuffled[0], words);
  };

  const generateOptions = (correctWord, allWords) => {
    // 정답 제외하고 오답 3개 뽑기
    const distractors = allWords
      .filter(w => w.id !== correctWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.meaning);
    
    // 정답과 합쳐서 셔플
    const combined = [...distractors, correctWord.meaning].sort(() => Math.random() - 0.5);
    setOptions(combined);
    setFeedback(null);
  };

  const handleAnswer = (selected) => {
    if (feedback) return; // 연속 클릭 방지
    const isCorrect = selected === quizSet[currentIndex].meaning;
    
    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    // 1.5초 후 다음 문제 혹은 결과창
    setTimeout(() => {
      if (currentIndex < quizSet.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        generateOptions(quizSet[nextIdx], words);
      } else {
        setView('result');
      }
    }, 1500);
  };
  // --- 퀴즈 로직 끝 ---

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', color: '#0052b4' }}>🇩🇪 Tag 2 마스터 퀴즈</h1>

      {/* 상단 네비게이션 */}
      <div style={navStyle}>
        <button onClick={() => setView('list')} style={view === 'list' ? activeTabStyle : tabStyle}>목록</button>
        <button onClick={startQuiz} style={view === 'quiz' ? activeTabStyle : tabStyle}>퀴즈 시작</button>
      </div>

      {/* 1. 목록 화면 */}
      {view === 'list' && (
        <div style={{ marginTop: '20px' }}>
          {words.map(item => (
            <div key={item.id} style={cardStyle}>
              <div style={{fontWeight: 'bold'}}>
                <span style={{ color: item.article === 'der' ? 'blue' : item.article === 'die' ? 'red' : item.article === 'das' ? 'green' : '#666' }}>
                  {item.article}
                </span> {item.word}
              </div>
              <div style={{fontSize: '14px', color: '#555'}}>{item.meaning}</div>
              {item.synonym && <div style={{fontSize: '12px', color: '#999'}}>유의어: {item.synonym}</div>}
            </div>
          ))}
        </div>
      )}

      {/* 2. 퀴즈 화면 */}
      {view === 'quiz' && quizSet[currentIndex] && (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <p style={{ color: '#999' }}>문제 {currentIndex + 1} / {quizSet.length}</p>
          <div style={quizBoxStyle}>
            <span style={{ fontSize: '18px', color: '#0052b4' }}>{quizSet[currentIndex].article}</span>
            <h2 style={{ fontSize: '36px', margin: '10px 0' }}>{quizSet[currentIndex].word}</h2>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswer(opt)}
                disabled={feedback}
                style={{
                  ...optionButtonStyle,
                  backgroundColor: feedback && opt === quizSet[currentIndex].meaning ? '#d4edda' : '#fff',
                  borderColor: feedback && opt === quizSet[currentIndex].meaning ? '#28a745' : '#ddd'
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          {feedback && (
            <div style={{ marginTop: '20px', padding: '15px', borderRadius: '10px', backgroundColor: feedback === 'correct' ? '#e7f3ff' : '#fff5f5' }}>
              <p style={{ fontWeight: 'bold', color: feedback === 'correct' ? '#0052b4' : '#e53e3e' }}>
                {feedback === 'correct' ? 'Richtig! (정답입니다)' : 'Falsch! (틀렸습니다)'}
              </p>
              <p style={{ fontSize: '14px', fontStyle: 'italic' }}>"{quizSet[currentIndex].example}"</p>
            </div>
          )}
        </div>
      )}

      {/* 3. 결과 화면 */}
      {view === 'result' && (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2 style={{ fontSize: '48px' }}>🎉</h2>
          <h3>퀴즈 완료!</h3>
          <p style={{ fontSize: '24px' }}>점수: <span style={{ color: '#0052b4', fontWeight: 'bold' }}>{score}</span> / {quizSet.length}</p>
          <button onClick={startQuiz} style={saveButtonStyle}>다시 도전하기</button>
          <button onClick={() => setView('list')} style={{ ...saveButtonStyle, background: '#666', marginTop: '10px' }}>목록으로 돌아가기</button>
        </div>
      )}
    </div>
  );
}

// 기존 스타일에 추가된 스타일들
const containerStyle = { maxWidth: '450px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' };
const navStyle = { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' };
const tabStyle = { flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer', color: '#999' };
const activeTabStyle = { ...tabStyle, color: '#0052b4', fontWeight: 'bold', borderBottom: '2px solid #0052b4' };
const cardStyle = { padding: '15px', borderBottom: '1px solid #eee' };
const quizBoxStyle = { padding: '40px 20px', background: '#f8fbff', borderRadius: '20px', marginBottom: '30px' };
const optionButtonStyle = { padding: '15px', border: '1px solid #ddd', borderRadius: '12px', fontSize: '16px', cursor: 'pointer', transition: '0.2s' };
const saveButtonStyle = { width: '100%', padding: '15px', background: '#0052b4', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };