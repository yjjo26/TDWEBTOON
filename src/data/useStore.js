import { useEffect, useState } from "react";
import { getState, subscribe } from "./store";

// 컴포넌트가 store 변경을 자동 구독하도록 도와주는 훅
export function useStoreState() {
  const [state, setState] = useState(() => getState());
  useEffect(() => {
    const unsub = subscribe((s) => setState({ ...s }));
    return unsub;
  }, []);
  return state;
}
