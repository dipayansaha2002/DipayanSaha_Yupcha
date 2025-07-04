import { createSignal, createEffect, For, Show } from 'solid-js';
import toast from 'solid-toast';

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

function AISocialAgentSolid() {
  const [isDarkMode, setIsDarkMode] = createSignal(false);
  const [topic, setTopic] = createSignal('');
  const [search, setSearch] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [listening, setListening] = createSignal(false);
  const [tweets, setTweets] = createSignal([]);
  const [tweetsLoading, setTweetsLoading] = createSignal(false);
  const [error, setError] = createSignal(null);

  const [editId, setEditId] = createSignal(null);
  const [editTopic, setEditTopic] = createSignal('');
  const [editContent, setEditContent] = createSignal('');

  const [limit] = createSignal(10);
  const [offset, setOffset] = createSignal(0);
  const [posted, setPosted] = createSignal(null);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [totalPages, setTotalPages] = createSignal(1);

  let recognition;

  createEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        setTopic(speechResult);
        showToast('Captured speech input!', 'success');
        setListening(false);
      };

      recognition.onerror = (event) => {
        showToast('Speech recognition error: ' + event.error, 'error');
        setListening(false);
      };

      recognition.onend = () => setListening(false);
    }
  });

  const fetchTweets = async () => {
    setTweetsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit().toString(),
        offset: offset().toString(),
        ...(search() && { search: search() }),
        ...(posted() !== null && { posted: posted().toString() })
      });

      const response = await fetch(`${BACKEND}/tweet/tweets?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tweets');

      const data = await response.json();
      setTweets(data.items);
      setCurrentPage(data.current_page);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error('Error fetching tweets:', error);
      showToast('Failed to fetch tweets', 'error');
    } finally {
      setTweetsLoading(false);
    }
  };

  createEffect(() => {
    fetchTweets();
  }, [search, offset, posted]);

  const showToast = (message, type) => {
    setError(type === 'error' ? message : null);
    if (type === 'success') toast.success(message);
    else toast.error(message);
  };

  const startListening = () => {
    if (!recognition) {
      showToast('Speech recognition is not supported in your browser.', 'error');
      return;
    }
    setListening(true);
    recognition.start();
  };

  const generateTweet = async () => {
    if (!topic().trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND}/tweet/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic().trim() })
      });
      if (!response.ok) throw new Error('Failed to generate tweet');

      showToast('Tweet generated!', 'success');
      setTopic('');
      setOffset(0);
      fetchTweets();
    } catch (error) {
      console.error('Error generating tweet:', error);
      showToast('Failed to generate tweet.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const postTweet = async (id) => {
    try {
      const response = await fetch(`${BACKEND}/tweet/post-tweet/${id}`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to post tweet');
      showToast('Tweet posted!', 'success');
      fetchTweets();
    } catch (error) {
      console.error('Error posting tweet:', error);
      showToast('Failed to post tweet.', 'error');
    }
  };

  const startEdit = (tweet) => {
    setEditId(tweet.id);
    setEditTopic(tweet.topic);
    setEditContent(tweet.content);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTopic('');
    setEditContent('');
  };

  const saveEdit = async (id) => {
    try {
      const response = await fetch(`${BACKEND}/tweet/edit/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: editTopic(), content: editContent() })
      });
      if (!response.ok) throw new Error('Failed to update tweet');
      showToast('Tweet updated!', 'success');
      cancelEdit();
      fetchTweets();
    } catch (error) {
      console.error('Error updating tweet:', error);
      showToast('Failed to update tweet.', 'error');
    }
  };

  const nextPage = () => {
    if (tweets().length >= limit()) setOffset(offset() + limit());
  };

  const prevPage = () => {
    setOffset(Math.max(0, offset() - limit()));
  };

  return (
    <div class={`min-h-screen transition-all duration-500 px-4 py-8 ${isDarkMode() ? 'bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white' : 'bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-500 text-white'}`}>
      <header class="flex justify-between items-center p-4 mb-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"></div>
          </div>
          <div>
            <h1 class="text-xl font-bold">AI Tweets</h1>
            <p class="text-sm opacity-80">Intelligent Social Media Tweet Automation</p>
          </div>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode())}
          class={`w-16 h-8 rounded-full relative ${isDarkMode() ? 'bg-purple-600' : 'bg-yellow-400'}`}
        >
          <div class={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${isDarkMode() ? 'translate-x-8' : 'translate-x-0'}`}>{isDarkMode() ? '🌙' : '☀️'}</div>
        </button>
      </header>

      <div class="text-center mb-8">
        <div class="w-20 h-20 mx-auto rounded-full bg-white/30 flex items-center justify-center mb-4">
          <span class="text-3xl">🤖</span>
        </div>
        <h2 class="text-4xl font-bold mb-2">AI Tweets</h2>
        <p class="text-lg">Generate engaging social media tweets with AI</p>
      </div>

      <div class="bg-white/20 p-6 rounded-2xl backdrop-blur-lg mb-6">
        <div class="relative mb-4">
          <input
            type="text"
            placeholder="Speak or type your topic..."
            value={topic()}
            onInput={(e) => setTopic(e.currentTarget.value)}
            class="w-full p-4 rounded-xl text-black"
          />
          <button
            onClick={startListening}
            class="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full"
          >
            {listening() ? '🔴' : '🎙️'}
          </button>
        </div>
        <button
          onClick={generateTweet}
          class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex justify-center items-center gap-2"
          disabled={loading() || !topic().trim()}
        >
          <span>⚡</span>
          {loading() ? 'Generating...' : 'Generate Tweet'}
        </button>
      </div>

      <div class="bg-white/20 p-6 rounded-2xl backdrop-blur-lg mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Search by topic..."
          value={search()}
          onInput={(e) => {
            setSearch(e.currentTarget.value);
            setOffset(0);
          }}
          class="p-3 rounded-xl text-black"
        />
        <select
          value={posted() === null ? '' : posted().toString()}
          onChange={(e) => {
            const val = e.currentTarget.value;
            setPosted(val === 'true' ? true : val === 'false' ? false : null);
            setOffset(0);
          }}
          class="p-3 rounded-xl text-black"
        >
          <option value="">All Tweets</option>
          <option value="true">Posted</option>
          <option value="false">Unposted</option>
        </select>
      </div>

      <Show when={error()}>
        <div class="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
          <p class="text-red-200">{error()}</p>
        </div>
      </Show>

      <Show when={!tweetsLoading() && Array.isArray(tweets()) && tweets().length === 0}>
        <div class="text-center py-12 rounded-2xl bg-white/20 backdrop-blur-lg">
          <div class="text-6xl mb-4">📝</div>
          <p class="text-xl mb-2">No tweets found</p>
          <p class="opacity-70">Generate your first tweet to get started!</p>
        </div>
      </Show>
    </div>
  );
}

export default AISocialAgentSolid;


// import { createSignal, createEffect, For, Show } from 'solid-js';
// import toast from 'solid-toast';


// const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// function AISocialAgentSolid() {
//   const [isDarkMode, setIsDarkMode] = createSignal(false);
//   const [topic, setTopic] = createSignal('');
//   const [search, setSearch] = createSignal('');
//   const [loading, setLoading] = createSignal(false);
//   const [listening, setListening] = createSignal(false);
//   const [tweets, setTweets] = createSignal([]);
//   const [tweetsLoading, setTweetsLoading] = createSignal(false);
//   const [error, setError] = createSignal(null);

//   const [editId, setEditId] = createSignal(null);
//   const [editTopic, setEditTopic] = createSignal('');
//   const [editContent, setEditContent] = createSignal('');

//   const [limit] = createSignal(10);
//   const [offset, setOffset] = createSignal(0);
//   const [posted, setPosted] = createSignal(null);
//   const [currentPage, setCurrentPage] = createSignal(1);
//   const [totalPages, setTotalPages] = createSignal(1);

//   let recognition;

//   createEffect(() => {
//     if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       recognition = new SpeechRecognition();
//       recognition.lang = 'en-US';
//       recognition.interimResults = false;
//       recognition.maxAlternatives = 1;

//       recognition.onresult = (event) => {
//         const speechResult = event.results[0][0].transcript;
//         setTopic(speechResult);
//         showToast('Captured speech input!', 'success');
//         setListening(false);
//       };

//       recognition.onerror = (event) => {
//         showToast('Speech recognition error: ' + event.error, 'error');
//         setListening(false);
//       };

//       recognition.onend = () => setListening(false);
//     }
//   });

//   const fetchTweets = async () => {
//     setTweetsLoading(true);
//     try {
//       const params = new URLSearchParams({
//         limit: limit().toString(),
//         offset: offset().toString(),
//         ...(search() && { search: search() }),
//         ...(posted() !== null && { posted: posted().toString() })
//       });

//       const response = await fetch(`${BACKEND}/tweet/tweets?${params}`);
//       if (!response.ok) throw new Error('Failed to fetch tweets');

//       const data = await response.json();
//       setTweets(data.items);
//       setCurrentPage(data.current_page);
//       setTotalPages(data.total_pages);
//     } catch (error) {
//       console.error('Error fetching tweets:', error);
//       showToast('Failed to fetch tweets', 'error');
//     } finally {
//       setTweetsLoading(false);
//     }
//   };

//   createEffect(() => {
//     fetchTweets();
//   }, [search, offset, posted]);

//   const showToast = (message, type) => {
//     setError(type === 'error' ? message : null);
//     if (type === 'success') toast.success(message);
//     else toast.error(message);
//   };

//   const startListening = () => {
//     if (!recognition) {
//       showToast('Speech recognition is not supported in your browser.', 'error');
//       return;
//     }
//     setListening(true);
//     recognition.start();
//   };

//   const generateTweet = async () => {
//     if (!topic().trim()) return;

//     try {
//       setLoading(true);
//       const response = await fetch(`${BACKEND}/tweet/generate`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ topic: topic().trim() })
//       });
//       if (!response.ok) throw new Error('Failed to generate tweet');

//       showToast('Tweet generated!', 'success');
//       setTopic('');
//       setOffset(0);
//       fetchTweets();
//     } catch (error) {
//       console.error('Error generating tweet:', error);
//       showToast('Failed to generate tweet.', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const postTweet = async (id) => {
//     try {
//       const response = await fetch(`${BACKEND}/tweet/post-tweet/${id}`, { method: 'POST' });
//       if (!response.ok) throw new Error('Failed to post tweet');
//       showToast('Tweet posted!', 'success');
//       fetchTweets();
//     } catch (error) {
//       console.error('Error posting tweet:', error);
//       showToast('Failed to post tweet.', 'error');
//     }
//   };

//   const startEdit = (tweet) => {
//     setEditId(tweet.id);
//     setEditTopic(tweet.topic);
//     setEditContent(tweet.content);
//   };

//   const cancelEdit = () => {
//     setEditId(null);
//     setEditTopic('');
//     setEditContent('');
//   };

//   const saveEdit = async (id) => {
//     try {
//       const response = await fetch(`${BACKEND}/tweet/edit/${id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ topic: editTopic(), content: editContent() })
//       });
//       if (!response.ok) throw new Error('Failed to update tweet');
//       showToast('Tweet updated!', 'success');
//       cancelEdit();
//       fetchTweets();
//     } catch (error) {
//       console.error('Error updating tweet:', error);
//       showToast('Failed to update tweet.', 'error');
//     }
//   };

//   const nextPage = () => {
//     if (tweets().length >= limit()) setOffset(offset() + limit());
//   };

//   const prevPage = () => {
//     setOffset(Math.max(0, offset() - limit()));
//   };

//   return (
//     <div class={`min-h-screen transition-all duration-500 px-4 py-8 ${isDarkMode() ? 'bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white' : 'bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-500 text-white'}`}>
//       <header class="flex justify-between items-center p-4 mb-8">
//         <div class="flex items-center gap-4">
//           <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center">
//             <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"></div>
//           </div>
//           <div>
//             <h1 class="text-xl font-bold">AI Tweets</h1>
//             <p class="text-sm opacity-80">Intelligent Social Media Tweet Automation</p>
//           </div>
//         </div>
//         <button
//           onClick={() => setIsDarkMode(!isDarkMode())}
//           class={`w-16 h-8 rounded-full relative ${isDarkMode() ? 'bg-purple-600' : 'bg-yellow-400'}`}
//         >
//           <div class={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${isDarkMode() ? 'translate-x-8' : 'translate-x-0'}`}>{isDarkMode() ? '🌙' : '☀️'}</div>
//         </button>
//       </header>

//       <div class="text-center mb-8">
//         <div class="w-20 h-20 mx-auto rounded-full bg-white/30 flex items-center justify-center mb-4">
//           <span class="text-3xl">🤖</span>
//           {/* <img src={logo} alt="Logo" class="w-full h-full object-cover" /> */}
//         </div>
//         <h2 class="text-4xl font-bold mb-2">AI Tweets</h2>
//         <p class="text-lg">Generate engaging social media tweets with AI</p>
//       </div>

//       <div class="bg-white/20 p-6 rounded-2xl backdrop-blur-lg mb-6">
//         <div class="relative mb-4">
//           <input
//             type="text"
//             placeholder="Speak or type your topic..."
//             value={topic()}
//             onInput={(e) => setTopic(e.currentTarget.value)}
//             class="w-full p-4 rounded-xl text-black"
//           />
//           <button
//             onClick={startListening}
//             class="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full"
//           >
//             {listening() ? '🔴' : '🎙️'}
//           </button>
//         </div>
//         <button
//           onClick={generateTweet}
//           class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex justify-center items-center gap-2"
//           disabled={loading() || !topic().trim()}
//         >
//           <span>⚡</span>
//           {loading() ? 'Generating...' : 'Generate Tweet'}
//         </button>
//       </div>

//       <div class="bg-white/20 p-6 rounded-2xl backdrop-blur-lg mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
//         <input
//           type="text"
//           placeholder="Search by topic..."
//           value={search()}
//           onInput={(e) => {
//             setSearch(e.currentTarget.value);
//             setOffset(0);
//           }}
//           class="p-3 rounded-xl text-black"
//         />
//         <select
//           value={posted() === null ? '' : posted().toString()}
//           onChange={(e) => {
//             const val = e.currentTarget.value;
//             setPosted(val === 'true' ? true : val === 'false' ? false : null);
//             setOffset(0);
//           }}
//           class="p-3 rounded-xl text-black"
//         >
//           <option value="">All Tweets</option>
//           <option value="true">Posted</option>
//           <option value="false">Unposted</option>
//         </select>
//       </div>

//       <Show when={error()}>
//         <div class="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
//           <p class="text-red-200">{error()}</p>
//         </div>
//       </Show>

//       <Show when={!tweetsLoading() && tweets().length === 0}>
//         <div class="text-center py-12 rounded-2xl bg-white/20 backdrop-blur-lg">
//           <div class="text-6xl mb-4">📝</div>
//           <p class="text-xl mb-2">No tweets found</p>
//           <p class="opacity-70">Generate your first tweet to get started!</p>
//         </div>
//       </Show>
//     </div>
//   );
// }

// export default AISocialAgentSolid;
