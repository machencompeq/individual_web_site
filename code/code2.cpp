/*
10942208 陳洺安 
DS2ex1_10942208
上機程式碼 
*/

#include<stdio.h>
#include<stdlib.h>
#include<string.h>
#include<string>
#include<iostream>
#include<fstream>
#include<vector>
#include<iomanip>

using namespace std ;

class Deap {
	/* 雙向堆積 */
	private:
		
		struct heapItemType {
			
			int serial_num ; // 序號 
			int numstu; //number of student 學生數 
			string sname; //school name 學校名稱 
			string dname; //department name  科系名稱 
			string type; //day or night 日間/進修別 
			string level; //grad or ungrad 等級別 
			
			
			
		}; // heapItemType
		
		
		
		int bottomIndex() { // 取得bottom的index . index[0] no data
			if( DoubleEndHeap.size() > 1 ) return DoubleEndHeap.size() ;
		} // bottomIndex()
		
 
		
		int judge_exp( int index ) { // 判斷次方 
			int level = 0;
    		while (index > 0) {
        		index = (index - 1) / 2; 
        		level++;
    		}
    		return level;
		} // judge_exp()
		 
		char Judge_dir( int index ) {
			/* 判斷INDEX是左子樹、還是右子樹 */ 
			int last = 1 ;
			for ( int n = 0 ; n < judge_exp( index ) ; n++ ) {
				last *= 2 ;
			} // for
			last = (last-1) + (last/2) ;
			
			if( index < last ) return 'L' ;
			else return 'R' ;
		}

		vector<heapItemType> DoubleEndHeap ; // 雙向堆積資料結構
	public:
		
		void reset() {
			DoubleEndHeap.clear(); // 清除雙堆積 
			heapItemType dummy ;
			DoubleEndHeap.push_back(dummy) ;  // 頭節點是空的 
		} // reset()	
		Deap() {
//			reset();
			
		} // Deap
		

		
		void prt_bottom_leftmost() {
			/* 印樹根 */
			cout << "<DEAP>" << endl ;
			//cout << "root: [" << maxHeap[0].serial_num << "] " << maxHeap[0].numstu  << endl ;
			cout << "bottom:	[" << DoubleEndHeap[this->bottomIndex()-1].serial_num << "] " << DoubleEndHeap[this->bottomIndex()-1].numstu  << endl ;
			
			int level = judge_exp( this->bottomIndex()-1) ; // 高
			int level_num = 1 ;
			for( int i = 0 ; i < level ; i++ ) level_num *= 2 ;
			
			//cout <<  level << endl ; 
			int leftest = level_num - 1 ;
			//cout <<  level_num << endl ; 
			cout << "leftmost bottom: [" << DoubleEndHeap[leftest].serial_num << "] " << DoubleEndHeap[leftest].numstu  << endl ;
			
		} // prt_root()
		
		bool IsEmpty() {
			if( DoubleEndHeap.size() <= 1 ) return true ;
			else false ;
		} // heapIsEmpty()
		
		void reBuildup( char max_min, int index ) {
			int father_pos = (index-1)/2 ;
			
			if( max_min == 'm' ) {
				
				while( DoubleEndHeap[father_pos].numstu < DoubleEndHeap[index].numstu && father_pos != 0 ) {
					// 用在max邊，向上整理 
					//cout << DoubleEndHeap[index].numstu << "交換" << DoubleEndHeap[father_pos].numstu << endl ; 
					heapItemType tmp = DoubleEndHeap[father_pos] ;
					DoubleEndHeap[father_pos] = DoubleEndHeap[index] ;
					DoubleEndHeap[index] = tmp ;
					index = father_pos ;
					father_pos = (index-1)/2 ;
				} // while
				
			}else {
				while( DoubleEndHeap[father_pos].numstu > DoubleEndHeap[index].numstu && father_pos != 0 ) {
					// 用在min邊，向上整理 
					//cout << DoubleEndHeap[index].numstu << "交換" << DoubleEndHeap[father_pos].numstu << endl ; 
					heapItemType tmp = DoubleEndHeap[father_pos] ;
					DoubleEndHeap[father_pos] = DoubleEndHeap[index] ;
					DoubleEndHeap[index] = tmp ;
					index = father_pos ;
					father_pos = (index-1)/2 ;
				} // while
			}
		} // reBuildup()
		
		void InsertItem( int serial_num , int numstu, string dname, string sname, string type, string level ) {
			/* 插在左子樹根右子樹的情形 */ 
			/*
			 * 插在左子樹，必無對應點，由父點代替
			 * 如果左(新的點)大於右就swap，新的點可能很大，並且向上rebuildup， 
			 * 換過去min右子樹的item本身就在buttom且比其父節點大不需要再變動 
			 * 如果沒有swap,插進來可能很小所以要向上rebuild 
			 *
			 *   
			 * 插在右子數，必有對應點
			 * 如果插入item小於左就swap，右子樹要向上rebuildup，新的點可能很小 
			 * 右邊對應節點本來就比較小所以不用動 
			 * 如果沒有swap,插進來可能很大所以要向上rebuild 
			 */
			heapItemType add_item ;
			add_item.serial_num = serial_num ;
			add_item.numstu = numstu ;
			add_item.dname = dname ;
			add_item.sname = sname ;
			add_item.type = type ;
			add_item.level = level ;
			
			DoubleEndHeap.push_back(add_item) ;
			if( this->Judge_dir(serial_num) == 'L' ) { // 插入左邊min 
				
				//cout << "左子樹收到" <<  serial_num << "\t" <<  numstu  << endl ;
				
				int map_pos = 1 ;// 對映節點位置 
				
				for( int i = 1 ; i < this->judge_exp(serial_num) ; i++ ) map_pos *= 2 ;
				
				map_pos += serial_num ;
				//cout << serial_num << "對映節點" << map_pos << endl ; 
				
				if( DoubleEndHeap.size() <= map_pos ) { // 如果沒有對映節點 
					//cout << "沒有對映節點" << endl ; 
					int father_pos ; // 對映節點的父親
					father_pos = (map_pos-1)/2 ;
					
					if( father_pos != 0) {
						//cout << "我找他爸" << father_pos << "\t" << DoubleEndHeap[father_pos].numstu << endl ;
						
						if( DoubleEndHeap[father_pos].numstu < DoubleEndHeap[serial_num].numstu ) { // swap && rebuild // 對映點父親小於現在 
							// cout << DoubleEndHeap[serial_num].numstu << "交換" << DoubleEndHeap[father_pos].numstu << endl ; 
							heapItemType tmp = DoubleEndHeap[father_pos] ;
							DoubleEndHeap[father_pos] = DoubleEndHeap[serial_num] ;
							DoubleEndHeap[serial_num] = tmp ;
							
							this->reBuildup( 'm', father_pos ) ;//向上rebuild 
						} // if
						else {
							//cout << "比他爸小,原地不動" << endl; 
							this->reBuildup( 'a', serial_num ) ;
						}
						
					}
					
				}
				else { // 不可能有對映點 
				}
				
				
				
			}else{ // 插在右子數
				//cout << "右子樹收到" <<  serial_num << "\t" <<  numstu  << endl ;
				// 插入item小於左就swap，右子樹要向上rebuildup
				int map_pos = 1 ;// 對映節點位置 
				for( int i = 1 ; i < this->judge_exp(serial_num) ; i++ ) map_pos*= 2 ;
				
				map_pos = serial_num - map_pos;
				//cout << serial_num << "對映節點" << map_pos << endl ; 
				
				if( DoubleEndHeap[map_pos].numstu > DoubleEndHeap[serial_num].numstu ) {
					//cout << DoubleEndHeap[serial_num].numstu << "交換" << DoubleEndHeap[map_pos].numstu << endl ; 
					
					heapItemType tmp = DoubleEndHeap[map_pos] ;
					DoubleEndHeap[map_pos] = DoubleEndHeap[serial_num] ;
					DoubleEndHeap[serial_num] = tmp ;
					this->reBuildup( 'a', map_pos ) ;
				}
				else reBuildup( 'm', serial_num ) ;
				
			}

			
		} // InsertItem() 逐一插入 
		
		
		int reHeapDown( int index ) {
			// 子節點是 index*2+1  index*2+2
			// case1 兩個節點存在 case2 只有左節點存在 
			// case1 比較左右兩點，再swap
			// until 子節點都比自己小or做到葉節點  
			//int left_child = index*2+1 ;
			//int right_child = index*2+2 ;
			
			//heapItemType pop_item ;
			
			if( index*2+2 <= DoubleEndHeap.size() ) { // 兩個節點存在
			
				if( DoubleEndHeap[index*2+2].numstu <= DoubleEndHeap[index*2+1].numstu && DoubleEndHeap[index].numstu < DoubleEndHeap[index*2+1].numstu ) { // 左大於右 
					heapItemType tmp = DoubleEndHeap[index] ;
					DoubleEndHeap[index] = DoubleEndHeap[index*2+1] ;
					DoubleEndHeap[index*2+1] = tmp ;
					//cout <<"走左邊" <<  index << "	swap	" << index*2+1 << endl ;
					index = index*2+1 ;
					
					
				} 
				else if( DoubleEndHeap[index*2+2].numstu > DoubleEndHeap[index*2+1].numstu && DoubleEndHeap[index].numstu < DoubleEndHeap[index*2+2].numstu ) {
					heapItemType tmp = DoubleEndHeap[index] ;
					DoubleEndHeap[index] = DoubleEndHeap[index*2+2] ;
					DoubleEndHeap[index*2+2] = tmp ;
					//cout <<"走右邊" <<  index << "	swap	" << index*2+2 << endl ;
					index = index*2+2 ;
					
					
				}
				else {
					return index ;
				}
			}else if ( index*2+1 <= DoubleEndHeap.size() ) { // 只有左節點存在
				if( DoubleEndHeap.size() == 2 ) {
					//pop_item = DoubleEndHeap[1] ; 
					return index ;
				}else {
					if( DoubleEndHeap[index].numstu < DoubleEndHeap[index*2+1].numstu ) {
						heapItemType tmp = DoubleEndHeap[index] ;
						DoubleEndHeap[index] = DoubleEndHeap[index*2+1] ;
						DoubleEndHeap[index*2+1] = tmp ;
						//cout <<"走左邊" <<  index << "	swap	" << index*2+1 << endl ;
						index = index*2+1 ;
					}
					else {
						return index ;
					}
				}
			}
			else {
				//cout << "沒有子點了" << endl ; 
				return index ;
			}
			//cout << "目前是點:		" << index << endl; 
			return reHeapDown( index ) ;
			
			
		} //  往下reheap 

		heapItemType delete_max() {
			// case 1 剩唯一左節點
			// case 2 第一右節點還存在
			heapItemType pop_item ;
			int map_pot = 1 ; 
			
			if( DoubleEndHeap.size() == 2 ) { // 除了最後一點 
				pop_item = DoubleEndHeap[1];
			} else { // 其他情況都是 DoubleEndHeap[2] 為最大值 
				//	cout<< DoubleEndHeap[2].numstu  << endl ; 
				pop_item = DoubleEndHeap[2] ; 
				//cout << DoubleEndHeap[2].numstu <<	"swap	"  << DoubleEndHeap[DoubleEndHeap.size()-1].numstu << endl ;
				
				DoubleEndHeap[2] = DoubleEndHeap[DoubleEndHeap.size()-1] ;
				DoubleEndHeap.pop_back(); 
				//cout << "可能是卡在這01" << endl ;
				//cout<< DoubleEndHeap[2].numstu  << endl ; 
				int index = this->reHeapDown(2) ; // 目前的index 
				//cout << "可能是卡在這02" << endl ;
				int level = this->judge_exp( index ) ;
				for( int i = 1 ; i < level ; i++ ) map_pot *= 2;
				map_pot = index - (map_pot) ;
				//cout<< "最後我站在" << index << endl ; 
				//cout<< "對應節點" <<  map_pot << endl ; 
				
				if( DoubleEndHeap[map_pot].numstu > DoubleEndHeap[index].numstu ) { // 對方比我大 
					heapItemType tmp = DoubleEndHeap[index] ;
					DoubleEndHeap[index] = DoubleEndHeap[map_pot] ;
					DoubleEndHeap[map_pot] = tmp ;
					this->reBuildup( 'n', map_pot ) ;
				}else {
					int map_pot_leftch = map_pot*2+1 ;
					int map_pot_rightch = map_pot*2+2 ;
					if( map_pot_rightch <= DoubleEndHeap.size()) {
						if( DoubleEndHeap[map_pot_rightch].numstu > DoubleEndHeap[map_pot_leftch].numstu && DoubleEndHeap[index].numstu < DoubleEndHeap[map_pot_rightch].numstu) { // 對方子節點比我大 
							heapItemType tmp = DoubleEndHeap[index] ;
							DoubleEndHeap[index] = DoubleEndHeap[map_pot_rightch] ;
							DoubleEndHeap[map_pot_rightch] = tmp ;
						}else if( DoubleEndHeap[map_pot_rightch].numstu <= DoubleEndHeap[map_pot_leftch].numstu && DoubleEndHeap[index].numstu < DoubleEndHeap[map_pot_leftch].numstu ) {
							heapItemType tmp = DoubleEndHeap[index] ;
							DoubleEndHeap[index] = DoubleEndHeap[map_pot_leftch] ;
							DoubleEndHeap[map_pot_leftch] = tmp ;		
						}
						else {
							
						}
					}else if( map_pot_leftch <= DoubleEndHeap.size() ) {
						if( DoubleEndHeap[index].numstu < DoubleEndHeap[map_pot_leftch].numstu) { // 對方子節點比我大 
							heapItemType tmp = DoubleEndHeap[index] ;
							DoubleEndHeap[index] = DoubleEndHeap[map_pot_leftch] ;
							DoubleEndHeap[map_pot_leftch] = tmp ;
						}
						else {
							
						}
					}

				}

			}
			
			//cout << "fin " << endl ;
			return pop_item ;
		} // 刪除最大值 
		
//		int index = 2 ;
		
		void topK( int k ) { // 刪除前k個最大值 
			
			
			//cout << "呼叫刪除函數" << endl ; 
			for( int index = 1 ; index <= k ; index++ ) {
				heapItemType pop_item = delete_max() ;
				cout << "Top" << setw(4) << index <<  ": " << "[" << pop_item.serial_num << "] " << pop_item.sname << pop_item.dname << "," << pop_item.type << "," << pop_item.level << "," << pop_item.numstu << endl ;
			}

		} 
		
		void prt() {
			for(int i = 1 ; i < this->bottomIndex() ; i++ ) cout <<  DoubleEndHeap[i].serial_num << "\t" << DoubleEndHeap[i].numstu << endl  ;
		} // 
}; // Deap


class MaxHeap {
	private:
		
		struct heapItemType {
			
			int serial_num ; // 序號 
			int numstu; //number of student 學生數 
			
		}; // heapItemType
		
		vector<heapItemType> maxHeap ; // 最大堆積資料結構
		
		int getbottomPos() { // 取得bottom的index 
			if( maxHeap.size() > 0 ) return maxHeap.size()-1 ;
		} // getbottomPos()
		
		void reset() {
			maxHeap.clear();
		} // reset()
		
		int judge_exp( int index ) { // 判斷次方 
			int level = 0;
    		while (index > 0) {
        		index = (index - 1) / 2; 
        		level++;
    		}
    		return level;
		} // judge_exp()
		
	public:
		
		MaxHeap() {
			reset();
		} // Heap()
		
		void prt_root_bottom_leftmost() {
			/* 印樹根 */
			cout << "<max heap>" << endl ;
			cout << "root: [" << maxHeap[0].serial_num << "] " << maxHeap[0].numstu  << endl ;
			cout << "bottom:	[" << maxHeap[this->getbottomPos()].serial_num << "] " << maxHeap[this->getbottomPos()].numstu  << endl ;
			
			/* 取n-1，扣掉偏移1 即是元素位置 */ 
			int level = judge_exp( this->getbottomPos() ) ;
			int level_num = 1 ;
			for( int i = 0 ; i < level ; i++ ) level_num *= 2 ;
			int leftest = level_num - 1 ;

			cout << "leftmost bottom: [" << maxHeap[leftest].serial_num << "] " << maxHeap[leftest].numstu  << endl ;
		} // prt_root()
		
		bool heapIsEmpty() {
			if( maxHeap.size() == 0 ) return true ;
		} // heapIsEmpty()
		
		void heapInsert( int serial_num , int numstu ) {
			/* 
			 * 將新元素放置bottom 
			 * 向父節點比較 
			 * 直到不大於父節點 
			*/
			heapItemType newItem ;
			newItem.serial_num = serial_num ;
			newItem.numstu = numstu ;
			maxHeap.push_back(newItem) ; // 添加在bottom
			
			int bottom_pos = this->getbottomPos() ;
			int grand_pos = (bottom_pos-1)/2 ;
			
			while( (maxHeap[bottom_pos].numstu > maxHeap[grand_pos].numstu) && bottom_pos > 0 ) {
				heapItemType tmp ;
				tmp = maxHeap[bottom_pos] ;
				maxHeap[bottom_pos] = maxHeap[grand_pos] ;
				maxHeap[grand_pos] = tmp ;
				
				bottom_pos = grand_pos ;
				grand_pos = (bottom_pos-1)/2 ;
			}
			
		} // heapInsert() 逐一插入 
		
		void heapDelete() {
			/* 移除root,並把bottom替上去(semi-heap),將root配置到正確位置*/
			/* unfinished */ 
			maxHeap[0] = maxHeap[this->getbottomPos()] ;
			maxHeap.pop_back() ;
			
		} // heapDelete();
		
		void heapRebuild() {
			/* 從底下向上逐步重整成最大堆積 */
			int cur = this->getbottomPos(); // 現在位置 
			int cur_grand ; // 父節點位置 
	
			while( cur > 0 ) { // 做到root停止 
				
				cur_grand = (cur-1)/2;
				
				if( maxHeap[cur].numstu > maxHeap[cur_grand].numstu ) { 
				// swap
					//cout << "交換" <<  maxHeap[cur].numstu <<  "&&" << maxHeap[cur_grand].numstu << endl ; 
					heapItemType tmp ;
					tmp = maxHeap[cur] ;
					maxHeap[cur] = maxHeap[cur_grand] ;
					maxHeap[cur_grand] = tmp ;
				}
				cur-- ;
			}
			
		} // heapRebuild()
		
		void prt() {
			for(int i = 0 ; i <= this->getbottomPos() ; i++ ) cout <<  maxHeap[i].serial_num << "\t" << maxHeap[i].numstu << endl  ;
		} // 
		 
}; // end Heap

class SchoolList {
	
	private:
		
		struct schoolType { // 資料型別 
			
			string cityname ; // 城市名稱 
			string system; // 體系別 
			string sname; //school name 學校名稱 
			string dname; //department name  科系名稱 
			string type; //day or night 日間/進修別 
			string level; //grad or ungrad 等級別 
			int schnum ; // school num 學校代碼 
			int depnum ; // department num 系所編號 
			int numstu; //number of student 學生數 
			int numprof; //number of professor 教師數 
			int numgrad; //number of graduates 上學年度畢業生數
			int serial_num ;
			 
		}; 
		
		int row = 0 ;
		string title = ""; // 標題 
		string fileID; // 檔案編號 
		
		vector<schoolType> allinfo; //dynamic allocation that save school information
		
		void reset() {
			allinfo.clear();
		}//end reset
		
		Deap deap_heap ;
		int re = 0 ;
	public:
		
		SchoolList() {
			reset(); 
			
		}
			
		~SchoolList() {
			reset();
		}
		
		bool readFile() {
			
			//Deap deap_heap ;
			allinfo.clear();
			fstream inFile;
			string fileName;
			this -> reset();
			cout << endl << "Input a file number ([0] Quit): ";
			cin >> this -> fileID;
			fileName = "input" + fileID + ".txt";
			inFile.open(fileName.c_str()) ;
			if(!inFile.is_open()){
				cout << endl << "###" << fileName << " does not exist!###"<<endl;
				return false;
			}
			else{
				char cstr[255];				
				int fNo, pre, pos;
				title = "" ;
				row = 0 ;
				inFile.getline(cstr,255,'\n'); // 大專校院各校科系別概況	
				inFile.getline(cstr,255,'\n'); // 105 學年度 SY2016-2017	
				inFile.getline(cstr,255,'\n'); 
				
				title.assign(cstr);
				
				while(inFile.getline(cstr,255,'\n')) {  // 第三列
					row++ ;
					schoolType oneR; // one data records 一筆學校資料 
					string buf,cut;
					
					fNo=0; // 一行的第幾筆資料 
					pre=0; // 前面略過多少字元 , 下一個起始位置 
					
					
					buf.assign(cstr);
					
					do {
						pos = buf.find_first_of('\t' , pre); // 遇到 '\t' 的字元位置 
						cut = buf.substr(pre, pos-pre);  // 現在位置 - 起始位置 
						
						switch(++fNo) {
							case 1 :
								oneR.schnum = atoi(cut.c_str());
							case 2:
								oneR.sname = cut;
								break;
							case 3:
								oneR.depnum = atoi(cut.c_str());
								break;
							case 4:
								oneR.dname = cut;
								break;
							case 5:	
								oneR.type = cut;
								break;
							case 6:
								oneR.level = cut;
								break;
							case 7: 
								oneR.numstu = atoi(cut.c_str());
								break;
							case 8:
								oneR.numprof = atoi(cut.c_str());
								break;
							case 9:
								oneR.numgrad = atoi(cut.c_str());
								break;
							case 10:
								oneR.cityname = cut;
								break;
							case 11:
								oneR.system = cut;
								break;
							default: 
								break;
						}
						pre = ++pos;
						
					}while((fNo < 12) && (pos > 0));//do
					
					oneR.serial_num = row ;
					this -> allinfo.push_back(oneR);
					
						
					
				} //while
				
				inFile.close();
			}//else
			
			if(!this->allinfo.size()) {
				cout << endl << "###Get nothing from the file" << fileName << "!###" <<endl;
				return false;
			}//if
			re = allinfo.size() ;
			
			return true;
		}//end readFile
		
		void printAllinfo() {
			cout << this->title << endl ;
			for(int i = 0 ; i < allinfo.size() ; i++) {
				
			
				cout << "[" << allinfo[i].serial_num << "]" << allinfo[i].schnum << '\t' << allinfo[i].sname << '\t' << allinfo[i].depnum << '\t' << allinfo[i].dname << '\t' << allinfo[i].type << '\t' << allinfo[i].level;
				cout <<'\t' << allinfo[i].numstu << '\t' << allinfo[i].numprof << '\t' << allinfo[i].numgrad << '\t' << allinfo[i].cityname << '\t' << allinfo[i].system <<  endl;
		
			}
		}
		
		void buildMaxHeap() {
			MaxHeap max_heap ;
			for( int i = 0 ; i < allinfo.size() ; i++ ) {
				max_heap.heapInsert( allinfo[i].serial_num, allinfo[i].numstu );
			} // for
			//max_heap.heapRebuild();
			//max_heap.prt(); // 列印堆積 
			max_heap.prt_root_bottom_leftmost();
		} // 建立堆積 
		
		void buildEAHeap() {
			deap_heap.reset();
			for( int i = 0 ; i < allinfo.size() ; i++ ) {
				
				deap_heap.InsertItem( allinfo[i].serial_num, allinfo[i].numstu, allinfo[i].dname, allinfo[i].sname, allinfo[i].type, allinfo[i].level );
				//int serial_num , int numstu, string dname, string sname, string type, string level
			} // for
			//deap_heap.heapRebuild();
			//max_heap.prt(); // 列印堆積 
			deap_heap.prt_bottom_leftmost();
			
		} // 建立堆積
		
		
		void topK() {
			//cout << "總共	" <<  this->allinfo.size();  
			int k = 0 ;
			//deap_heap.prt();
			
			if( re >= 1 && k <= re) {
				
				cout << endl << "Enter the value of K in" << "[1," << re << "]:" ;
				cin >> k ;
				if( k > re ) cout << "over boundary situation 1 : 一次刪除比剩餘資料筆數還多 " << endl ; // 一次刪除比資料筆數還多 
				else {
					// 呼叫topK函數
					deap_heap.topK( k ) ;
					re -= k ;
				}
			}
			else{
				cout << "over boundary situation 2 : 沒資料給你刪了" << endl ; // 無法再刪除 
			}
			//cout << "剩餘資料	" <<  re ; 
		} // TopK
		
}; //end SchoolList



int main() {
	int cmd = -1;
	SchoolList sch;
	string school_name = "" ;
	bool check = false ;
	do {
		
        cout << endl << "**** Heap Construction ********" << endl;
        cout << "* 0. Quit                     *" << endl;
        cout << "* 1. Build a max heap         *" << endl;
        cout << "* 2. Build a DEAP             *" << endl;
        cout << "* 3. Top-K maximums from DEAP *" << endl;
        cout << "*******************************" << endl;
        cout << "Input a choice(0, 1, 2, 3): ";
        cin >> cmd;
        switch(cmd){
        	case 0:
        		break;
			case 1:	
				if(sch.readFile()) sch.buildMaxHeap() ;
				break;
			case 2:
				if(sch.readFile()) {
					sch.buildEAHeap() ;
					check = true ;
				}
			break;
			case 3: 
				if( check ) {
					sch.topK()  ;
				}
				else cout << "build deap first !!!" ;
			break;
			default:
				cout << endl << "Command does not exist!" << endl << endl;
			break;
		}
		
	} while(cmd!=0);
	system("pause");
	return 0;
}
