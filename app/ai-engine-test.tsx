import { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import AIEngine from '../src/ai/AIEngine';

export default function AIEngineTestScreen() {
  const [backend, setBackend] = useState<string>('init...');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    AIEngine.init().then(info => {
      setBackend(info.backend);
      console.log('AIEngine backend:', info.backend);
    });
  }, []);

  const handleRun = async () => {
    const input = [0.1, 0.5, -0.3, 0.7];
    const out = await AIEngine.predict(input);
    setResult(out);
    console.log('AIEngine result:', out);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CerebraX AIEngine Test</Text>
      <Text>Backend: {backend}</Text>
      <Button title="Прогнать инференс" onPress={handleRun} />
      {result && <Text style={styles.result}>{JSON.stringify(result)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  result: { marginTop: 20, fontSize: 14, color: 'lime' },
});
