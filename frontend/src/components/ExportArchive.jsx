import React, { useState } from 'react';
import { apiGet } from '../services/api';

export default function ExportArchive() {
  const [encrypt, setEncrypt] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const handleExport = async () => {
    if (encrypt && passphrase !== confirmPassphrase) {
      setStatus('Passphrases do not match.');
      return;
    }
    if (encrypt && !passphrase) {
      setStatus('Please enter a passphrase.');
      return;
    }

    setLoading(true);
    setStatus('Fetching entries...');
    
    try {
      const data = await apiGet('/api/export');
      const jsonStr = JSON.stringify(data.entries);
      
      let finalContent;
      let filename;

      if (encrypt) {
        setStatus('Encrypting data...');
        const enc = new TextEncoder();
        
        // Derive key
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          enc.encode(passphrase),
          { name: 'PBKDF2' },
          false,
          ['deriveBits', 'deriveKey']
        );
        
        const key = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
          },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
        );

        // Encrypt
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ciphertext = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv },
          key,
          enc.encode(jsonStr)
        );

        const payload = {
          salt: arrayBufferToBase64(salt),
          iv: arrayBufferToBase64(iv),
          ciphertext: arrayBufferToBase64(ciphertext),
          algorithm: 'AES-GCM',
          kdf: 'PBKDF2',
          iterations: 100000
        };

        finalContent = JSON.stringify(payload, null, 2);
        filename = `journal-export-encrypted-${new Date().toISOString().slice(0,10)}.json`;
      } else {
        finalContent = JSON.stringify(data.entries, null, 2);
        filename = `journal-export-${new Date().toISOString().slice(0,10)}.json`;
      }

      setStatus('Downloading...');
      const blob = new Blob([finalContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatus('Export complete.');
    } catch (err) {
      console.error(err);
      setStatus(`Export failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Export Archive</h2>
      <div className="card">
        <p>Download all your journal entries. You can optionally encrypt the export file.</p>
        
        <div style={{ margin: '20px 0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={encrypt} 
              onChange={e => setEncrypt(e.target.checked)} 
              style={{ width: 'auto' }}
            />
            Encrypt with passphrase
          </label>
        </div>

        {encrypt && (
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder="Passphrase"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Passphrase"
              value={confirmPassphrase}
              onChange={e => setConfirmPassphrase(e.target.value)}
            />
            <small style={{ color: 'var(--text-secondary)' }}>
              Make sure you remember this passphrase. It cannot be recovered!
            </small>
          </div>
        )}

        <button className="primary" onClick={handleExport} disabled={loading}>
          {loading ? 'Exporting...' : 'Export Journal'}
        </button>

        {status && (
          <div style={{ marginTop: '15px', color: status.includes('failed') ? 'var(--danger-color)' : 'var(--text-primary)' }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
