import os

def main():
    file_path = r"D:\\secrets\\practical-now-467207-i1-78c48381554e.json"
    
    print(f"Checking file: {file_path}")
    
    if os.path.exists(file_path):
        print("✅ File exists")
        print(f"File size: {os.path.getsize(file_path)} bytes")
        
        try:
            with open(file_path, 'r') as f:
                content = f.read(100)  # Read first 100 characters
                print("\nFirst 100 characters:")
                print("-" * 50)
                print(content)
                print("-" * 50)
        except Exception as e:
            print(f"\n❌ Error reading file: {str(e)}")
    else:
        print("❌ File does not exist")
        
        # Check if directory exists
        dir_path = os.path.dirname(file_path)
        if os.path.exists(dir_path):
            print(f"\n📁 Directory exists: {dir_path}")
            print("Files in directory:")
            try:
                for f in os.listdir(dir_path):
                    print(f"- {f}")
            except Exception as e:
                print(f"Error listing directory: {str(e)}")
        else:
            print(f"\n❌ Directory does not exist: {dir_path}")

if __name__ == "__main__":
    main()
