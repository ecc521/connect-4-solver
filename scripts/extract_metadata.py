import os
import json
import struct

def extract_metadata(data_dir):
    metadata = {}
    
    for filename in os.listdir(data_dir):
        if not filename.endswith('.cbook'):
            continue
            
        filepath = os.path.join(data_dir, filename)
        try:
            with open(filepath, 'rb') as f:
                header = f.read(6)
                if len(header) < 6:
                    continue
                    
                width, height, depth, key_bytes, value_bytes, log_size = struct.unpack('<bbbbbb', header)
                
                # Cuckoo validation
                if value_bytes != 2:
                    continue
                    
                file_size = os.path.getsize(filepath)
                num_buckets = (file_size - 6) // 8
                
                metadata[filename] = {
                    "width": width,
                    "height": height,
                    "depth": depth,
                    "size_bytes": file_size,
                    "num_buckets": num_buckets,
                    "cuckoo": True
                }
        except Exception as e:
            print(f"Failed to process {filename}: {e}")
            
    with open(os.path.join(data_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Extracted metadata for {len(metadata)} Cuckoo books.")

if __name__ == '__main__':
    extract_metadata('../data')
