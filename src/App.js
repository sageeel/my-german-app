import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [view, setView] = useState('daySelect');
  const [selectedDay, setSelectedDay] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);

  // 퀴즈 관련 상태
  const [quizSet, setQuizSet] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  // 특정 Day의 단어 가져오기
  const fetchWordsByDay = async (day) => {
    setLoading(true);
    setSelectedDay(day);
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('day', day);

    if (error) {
      console.error('Error:', error);
      alert('데이터를 불러오지 못했습니다.');
    } else {
      setWords(data);
      setView('list');
    }
    setLoading(false);
  };

  // --- 퀴즈 로직 (20문항으로 수정) ---
  const startQuiz = () => {
    if (words.length < 4) return alert('퀴즈를 위해 최소 4개 이상의 단어가 필요합니다!');
    
    // 무작위로 20문제 추출 (단어 수가 20개 미만일 경우 전체 출력)
    const quizCount = words.length < 20 ? words.length : 20;
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, quizCount);
    
    setQuizSet(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setView('quiz');
    generateOptions(shuffled[0], words);
  };

  const generateOptions = (correctWord, allWords) => {
    const distractors = allWords
      .filter(w => w.id !== correctWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.meaning);
    const combined = [...distractors, correctWord.meaning].sort(() => Math.random() - 0.5);
    setOptions(combined);
    setFeedback(null);
  };

  const handleAnswer = (selected) => {
    if (feedback) return;
    const isCorrect = selected === quizSet[currentIndex].meaning;
    if (isCorrect) { setScore(s => s + 1); setFeedback('correct'); }
    else { setFeedback('wrong'); }

    setTimeout(() => {
      if (currentIndex < quizSet.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        generateOptions(quizSet[nextIdx], words);
      } else { setView('result'); }
    }, 1000);
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', color: '#0052b4', cursor: 'pointer' }} onClick={() => setView('daySelect')}>
        🇩🇪 FLEX 마스터
      </h1>

      {/* 1. 날짜 선택 화면 (Day 20까지 생성) */}
      {view === 'daySelect' && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>학습할 날짜를 선택하세요</h3>
          <div style={dayGridStyle}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(d => (
              <button key={d} onClick={() => fetchWordsByDay(d)} style={dayButtonStyle}>
                Day {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <p style={{textAlign:'center', marginTop: '50px'}}>데이터 로딩 중...</p>}

      {!loading && view !== 'daySelect' && (
        <>
          <div style={navStyle}>
             <button onClick={() => setView('list')} style={view === 'list' ? activeTabStyle : tabStyle}>목록</button>
             <button onClick={startQuiz} style={view === 'quiz' ? activeTabStyle : tabStyle}>20문제 퀴즈</button>
             <button onClick={() => setView('daySelect')} style={tabStyle}>날짜변경</button>
          </div>

          {view === 'list' && (
            <div style={{ marginTop: '10px' }}>
              <p style={{fontSize: '14px', color: '#666'}}>Day {selectedDay} 총 {words.length}단어</p>
              {words.map(item => (
                <div key={item.id} style={cardStyle}>
                  <div style={{fontWeight: 'bold'}}>
                    <span style={{ color: item.article === 'der' ? 'blue' : item.article === 'die' ? 'red' : item.article === 'das' ? 'green' : '#666' }}>
                      {item.article}
                    </span> {item.word}
                  </div>
                  <div style={{fontSize: '14px', color: '#555'}}>{item.meaning}</div>
                </div>
              ))}
            </div>
          )}

          {view === 'quiz' && (
             <div style={{ textAlign: 'center' }}>
                {/* 진행률 바 추가 */}
                <div style={{ background: '#eee', height: '8px', borderRadius: '4px', marginBottom: '20px' }}>
                  <div style={{ 
                    background: '#0052b4', 
                    height: '100%', 
                    borderRadius: '4px', 
                    width: `${((currentIndex + 1) / quizSet.length) * 100}%`,
                    transition: '0.3s'
                  }} />
                </div>
                <p style={{color: '#888'}}>Q {currentIndex + 1} / {quizSet.length}</p>
                <div style={quizBoxStyle}>
                  <h2 style={{ fontSize: '32px' }}>{quizSet[currentIndex].word}</h2>
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(opt)} disabled={feedback} style={{
                      ...optionButtonStyle,
                      background: feedback && opt === quizSet[currentIndex].meaning ? '#d4edda' : '#fff'
                    }}>{opt}</button>
                  ))}
                </div>
                {feedback && <p style={{marginTop:'15px', color: feedback === 'correct' ? 'blue' : 'red', fontWeight: 'bold'}}>
                  {feedback === 'correct' ? 'Richtig! (정답)' : 'Falsch! (오답)'}
                </p>}
             </div>
          )}

          {view === 'result' && (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
              <h1 style={{fontSize: '60px'}}>🎖️</h1>
              <h2>Day {selectedDay} 완료!</h2>
              <p style={{fontSize: '24px'}}>점수: <b>{score}</b> / {quizSet.length}</p>
              <button onClick={() => setView('daySelect')} style={saveButtonStyle}>다른 날짜 공부하기</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 스타일 시트
const containerStyle = { maxWidth: '450px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' };
const dayGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' };
const dayButtonStyle = { padding: '12px 5px', fontSize: '14px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' };
const navStyle = { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #eee' };
const tabStyle = { flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer', color: '#999' };
const activeTabStyle = { ...tabStyle, color: '#0052b4', fontWeight: 'bold', borderBottom: '2px solid #0052b4' };
const cardStyle = { padding: '12px', borderBottom: '1px solid #eee' };
const quizBoxStyle = { padding: '40px 20px', background: '#f8fbff', borderRadius: '20px', marginBottom: '20px' };
const optionButtonStyle = { padding: '15px', border: '1px solid #ddd', borderRadius: '12px', cursor: 'pointer' };
const saveButtonStyle = { width: '100%', padding: '15px', background: '#0052b4', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', marginTop: '20px' };