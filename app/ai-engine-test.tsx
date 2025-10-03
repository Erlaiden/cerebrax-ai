import { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import AIEngine from '../src/ai/AIEngine';

export default function AIEngineTest() {
  const [backend, setBackend] = useState('init...');
  const [out, setOut] = useState<any>(null);

  useEffect(() => {
    AIEngine.init().then(i => setBackend(i.backend));
  }, []);

  const run = async () => {
    const res = await AIEngine.predict([0.12, -0.3, 0.5, 0.9, -0.1, 0.2]);
    setOut(res);
  };

  return (
    <View style={s.c}>
      <Text style={s.t}>CerebraX AIEngine Test</Text>
      <Text>Backend: {backend}</Text>
      <Button title="Run inference" onPress={run} />
      {out && <Text style={s.r}>{JSON.stringify(out)}</Text>}
    </View>
  );
}
const s = StyleSheet.create({
  c:{flex:1,justifyContent:'center',alignItems:'center',padding:16},
  t:{fontSize:20,fontWeight:'bold',marginBottom:12},
  r:{marginTop:12,fontSize:12}
});
