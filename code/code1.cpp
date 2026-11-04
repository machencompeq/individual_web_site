// 11127116 ����E 10942208 ���y�w
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <cstdlib>
#include <iomanip>

using namespace std;

struct schooltype {
    string sname = "";                   // school name
    string dname = "";                   // department name
    string type = "";                    // either day or night
    string level = "";                   // graduate or undergraduate
    int num = 0;                        //input order of data
    int nstud;                      // number of students
    int ngrad;                      // number of school data
};

struct nodeType {
    vector <schooltype> key;                  // search key
    nodeType *lchild ;     // left child
    nodeType *rchild ;     // right child
    int height; // height of node
    nodeType(schooltype newKey) : lchild(NULL), rchild(NULL), height(1) {
        key.push_back(newKey);
    }
};

class threeTwoTree {


private :

    struct threeTwoTreenodeType {

        vector<int> items; // 鍵值
        vector<int> items_keys; // 鍵值
        vector<threeTwoTreenodeType*> children; // 子節點
        threeTwoTreenodeType* father = NULL ;
    };

    threeTwoTreenodeType* root = NULL ;
    int tree_height = 0 ;
    int tree_node = 0 ;

    void orderNode(threeTwoTreenodeType* &node ) {
        // 排序節點內的數字
        // bubble sort
        for( int j = 0 ; j < node->items.size()-1 ; j++ ) {
            for( int i = 0 ; i < node->items.size()-1 ; i++ ) {
                if( node->items[i] > node->items[i+1] ) {
                    int tmp ;
                    //cout << node->items[i] ;
                    tmp = node->items[i+1] ;
                    node->items[i+1] = node->items[i] ;
                    node->items[i] = tmp ;
                };
            } // for
        }
    };

public:
    threeTwoTree() {
        // constructor
        // root = new threeTwoTreenodeType ;

    }
    threeTwoTreenodeType* getRoot(){
        return root;
    }

    void printTop(int& num, threeTwoTreenodeType* cur, vector<int>& top) {
	    // cur != NULL

		
        if ( cur->children.size() == 0  ) {
            for ( int i = cur->items.size()-1; top.size() <= num && i >= 0; i-- ) {
                top.push_back(cur->items[i]);
            } // for
            return;
        }

        int item = cur->items.size()-1;
        for ( int i  = cur->children.size()-1; top.size() <= num && i >= 0; i-- ) {
            printTop(num, cur->children[i] , top);
            top.push_back( cur->items[item] );
            item--;
        } // for 
        
        if (cur == NULL)
	        return;
	
	    
	    if (top.size() >= num)
	        return;
	
	    // overboundary
	    if (cur->items.empty())
	        return;

    }

    void spiltNode( threeTwoTreenodeType* cur ) { 

        if( cur->items.size() == 3 ) {

            threeTwoTreenodeType* new_node = new threeTwoTreenodeType(); 
            tree_node++  ;
            new_node->items.push_back(cur->items[2]); 
            cur->items.pop_back();
            int mid_key = cur->items[1]; 
            cur->items.pop_back();


            if( cur == root ) {
                threeTwoTreenodeType* new_root = new threeTwoTreenodeType();
                tree_node++;
                new_root->items.push_back(mid_key); // 中間值放入新頭
                new_root->children.push_back(cur);

                for (int i = 0; i < new_root->children.size(); i++) {
                    if (new_root->children[i] == cur) {
                        new_root->children.insert(new_root->children.begin() + i+1, new_node);
                        break;
                    }
                }
                cur->father = new_root ;
                new_node->father = new_root ;

                int origin_size = cur->children.size();
                for (int i = origin_size-1; i >= 0; i--) {
                    //cout << "cur->children.size(): " << cur->children.size() << endl;
                    if (cur->children[i]->items.back() > mid_key) { // 檢查子節點的最後一個項目是否大於給定的 keys
                        //cout << cur->children[i]->items.back() << "	cur->children[i]->items.back() > mid_key	" << mid_key	<< endl;
                        threeTwoTreenodeType* element = cur->children[i];
                        cur->children[i]->father = new_node;
                        cur->children.erase(cur->children.begin() + i);
                        new_node->children.insert(new_node->children.begin(), element);
                        //cout << "new_node->children.size: " << new_node->children.size() << endl;
                    }
                }
                root = new_root ;
                tree_height++ ;
            }
            else {
                threeTwoTreenodeType* father = new threeTwoTreenodeType;
                father = cur->father ;
                father->items.push_back(mid_key);
                this->orderNode(father) ;

//		            // 調整父節點的子節點指針
                for (int i = 0; i < father->children.size(); i++) {
                    if (father->children[i] == cur) {
                        father->children.insert(father->children.begin() + i +1 , new_node);
                        break;
                    }
                }

                new_node->father = father ;

                int origin_size = cur->children.size();
                for (int i = origin_size-1; i >= 0; i--) {
                    //cout << "cur->children.size(): " << cur->children.size() << endl;
                    if (cur->children[i]->items.back() > mid_key) { 
                        threeTwoTreenodeType* element = cur->children[i];
                        cur->children[i]->father = new_node;
                        cur->children.erase(cur->children.begin() + i);
                        new_node->children.insert(new_node->children.begin(), element);
                        //cout << "new_node->children.size: " << new_node->children.size() << endl;
                    }
                }
                
                spiltNode(father);

            }
        }


    } // spiltNode()

    void treeInsert(int numgrad) {
        //cout << "------------insert:	" << numgrad <<  "--------------------" << endl ;

        // 插入
        if( root == NULL ) {
            root = new threeTwoTreenodeType ;
            tree_node++  ;
            root->items.push_back( numgrad ) ;
            tree_height = 1 ;
        }
        else {

            threeTwoTreenodeType* cur = root ;

            for( int i = 0 ;  ! ( cur->children.size() == 0 ) ; i++ ) {

                if( cur->items.size() == 1  ) { // 1個key
                    if( numgrad < cur->items[0] ) {
                        cur = cur->children[0] ;
                    }else {
                        cur = cur->children[1] ;
                    }
                }else if ( cur->items.size() == 2 ) {// 2個key


                    if( numgrad < cur->items[0] && cur->children[0] != NULL ) {
                        cur = cur->children[0] ;
                    }else if ( cur->items[1] < numgrad && cur->children[2] != NULL  ) {
                        cur = cur->children[2] ;
                    }else if ( cur->items[1] > numgrad &&  numgrad > cur->items[0] && cur->children[1] != NULL ) {
                        cur = cur->children[1] ;
                    }
                    else {
                        break;
                        //cout << "ambigious" <<	endl ;
                    }
                }
            } // for
            // 走道葉子後放入node並排序
            cur->items.push_back( numgrad ) ;
            // 排序節點內部
            this->orderNode( cur ) ;
            // 如果大於三就spilt
            if(cur->items.size() == 3 ) {
                // cout << "spilt  start(med)" << cur->items[1] << endl ;
                this->spiltNode( cur ) ;
            }
            else if( cur->items.size() > 3 ) {
                cout << "over boundary" << endl ;
            }

        }
    

    } // treeInsert()

    vector<int> show() {
        vector<int> root_items ;
        root_items.clear();


        for( int i = 0 ;i < root->items.size() ; i++ ) {
            root_items.push_back( root->items[i] );
        } // for

        cout << "Tree height = " << tree_height << endl ;
        cout << "Number of nodes = " << tree_node ;
        return root_items ;
    } // show()



    void clearUp() {
        root = NULL ;
        tree_height = 0 ;
        tree_node = 0 ;
    }
}; // end class threeTwoTree

class AVLTree {

    nodeType *root;
    void clearNode(nodeType* node);
    int getHeight ( nodeType* node ) ;
    int balanceFactor( nodeType* cur );
    nodeType* LLRotate( nodeType* node );
    nodeType* RRRotate( nodeType* node );
    int countNode( nodeType* root );

public:
    AVLTree() : root(NULL) {}   // constructor of an empty tree
    nodeType* getRoot (){
        return root;
    }


    nodeType* intsertAVL( nodeType* cur ,schooltype allR );
    void AVLShow(  ) ;
    bool isEmpty(){
        if ( root == NULL )
            return true;
        else
            return false;
    }
    void AVLPrintTop(int&, nodeType*, int& );

    void setRoot( nodeType* newRoot ) {
        root = newRoot;
    } // renew the Root

    void clearUp() {                    // cut off the entire tree
        clearNode(root);
        root = NULL;
    } // end clearUp

    ~AVLTree() { clearUp(); }
};

class schoolList {
    vector<schooltype> allR;                      // set of data records
    AVLTree theAVLTree;
    threeTwoTree the23Tree;

public:
    string fileID;                                // number to form a file name
    schoolList() { clearUp(); }   // constructor: do nothing
    bool isEmpty() ;            // check if there is nothing
    void readF( string );               // read records from a file
    void insertAVL();
    void showAVL(  );
    void clearAVL();
    void insert23();
    void show23();
    void clear23();
    bool AVLIsEmpty();
    void printTopK(int);
    void printTopK23(int);
    int numOfList(){
        return allR.size();
    }

    void clearUp() {            // erase the object content
        allR.clear();
        fileID.clear();
        theAVLTree.clearUp();
        //the23Tree.clearUp();
        // remenber to build destructor
    } // end clearUp


    ~schoolList() { clearUp(); }      // destructor: destroy the object
};

int main() {
    int cmd = -1;
    string fileName;
    schoolList aList;
    int AVLNode = 0;
   
	do {
		
        // UI
        cout << endl << "**** Balanced Search Trees ****";
        cout << endl << "* 0. QUIT                     *";
        cout << endl << "* 1. Build 23 tree            *";
        cout << endl << "* 2. Build AVL tree           *";
        cout << endl << "* 3. Top-K search on 23 tree  *";
        cout << endl << "* 4. Top-K search on AVL tree *";
        cout << endl << "*******************************";
        cout << endl << "Input a choice(0, 1, 2, 3, 4): ";
        if(!(cin >> cmd)) {
        	cout << endl << "Command does not exist!" << endl << endl;
        	cmd = -1 ;
        	cin.clear();
        	while (cin.get() != '\n') {
            	continue;
        	}
        	
		}
		else {
				switch(cmd){
	        	case 0:
	        		break;
				case 1:	
					aList.clearUp();
		            aList.clear23();
		            cout << endl << "Input a file number ([0] Quit): ";
		            cin >> fileName;
		            if ( fileName != "0" ) {
		                aList.readF( fileName );
		                aList.insert23();
		                aList.show23();
		
		            }
		            else {
		
		            }
					break;
				case 2:
					aList.clearAVL();
		            if ( aList.isEmpty() )
		                cout << "### Choose 1 first. ###" << endl;
		            else {
		                aList.insertAVL();
		                aList.showAVL();
		            }
				break;
				case 3: 
					if ( aList.isEmpty() )
		                cout << "### Choose 1 first. ###"<< endl;
		            else {
		                int kNum = 0;
		                cout << endl <<"Enter the value of K in [1," << aList.numOfList() << "]:" ;
		                cin >> kNum;
		                aList.printTopK23(kNum);
		                cout << endl;
		
		            }
				break;
				case 4: 
					if ( aList.isEmpty() )
		                cout << "### Choose 1 first. ###"<< endl;
		            else if ( aList.AVLIsEmpty() )
		                cout << "### Choose 2 first. ###"<< endl;
		            else {
		                int kNum = 0;
		                cout << endl << "Enter the value of K in [1," << aList.numOfList() << "]:";
		                cin  >> kNum;
		                aList.printTopK(kNum);
		                cout << endl ;
		
		            }
				break;
				default:
					cout << endl << "Command does not exist!" << endl << endl;
				break;
			}
		}
        // sort the file
        
	} while(cmd!=0);
	system("pause");
	return 0;
}

//-----------------------------------------------------------------------------------
void AVLTree ::AVLPrintTop(int &num, nodeType* cur, int&j ) {

    if( num <= 0 || cur == NULL )
        return;



    AVLPrintTop( num,  cur->rchild, j);

    if ( num > 0 ) {
        for ( int i = 0; i < cur->key.size(); i++ ) {
            cout << j << ": " << "[" << cur->key[i].num << "] " << cur->key[i].sname << ", " ;
            cout << cur->key[i].dname << ", " << cur->key[i].type << ", " << cur->key[i].level;
            cout << ", " << cur->key[i].nstud << ", " << cur->key[i].ngrad <<endl;
            j++;
            num--;
        }
    }

    AVLPrintTop( num, cur->lchild, j );

}

nodeType* AVLTree :: intsertAVL( nodeType* cur, schooltype newNode ) {
    if ( cur == NULL)
        return (new nodeType ( newNode ));


    if ( cur->key[0].nstud == newNode.nstud )
        cur->key.push_back(newNode);
    else if ( cur->key[0].nstud > newNode.nstud )
        cur->lchild = intsertAVL(cur->lchild, newNode);
    else
        cur->rchild = intsertAVL(cur->rchild, newNode);

    int lHeight = getHeight(cur->lchild), rHeight = getHeight(cur->rchild);
    if ( lHeight > rHeight )
        cur->height = lHeight+1;
    else
        cur->height = rHeight+1;

    int balanceF = balanceFactor(cur);

    if ( balanceF > 1 ){
        balanceF = balanceFactor(cur->lchild);
        if ( balanceF == 1 )
            return LLRotate(cur);// LL
        else {
            cur->lchild = RRRotate(cur->lchild);
            return LLRotate(cur);
        }

    }
    else if ( balanceF < -1 ){
        balanceF = balanceFactor(cur->rchild);
        if ( balanceF == -1 )
            return RRRotate(cur); // RR
        else {
            cur->rchild = LLRotate(cur->rchild);
            return RRRotate( cur );
        }
    }


    return cur;
}

nodeType* AVLTree ::LLRotate(nodeType *node) {
    nodeType* leftChild = node->lchild;
    node->lchild = leftChild->rchild;
    leftChild->rchild = node;

    int lHeight = getHeight(node->lchild), rHeight = getHeight(node->rchild);
    if ( lHeight > rHeight )
        node->height = lHeight+1;
    else
        node->height = rHeight+1;

    lHeight = getHeight(leftChild->lchild), rHeight = getHeight(leftChild->rchild);
    if ( lHeight > rHeight )
        leftChild->height = lHeight+1;
    else
        leftChild->height = rHeight+1;


    return leftChild;
}

nodeType* AVLTree ::RRRotate(nodeType *node) {
    nodeType* rightChild = node->rchild;
    node->rchild = rightChild->lchild;
    rightChild->lchild = node;

    int lHeight = getHeight(node->lchild), rHeight = getHeight(node->rchild);
    if ( lHeight > rHeight )
        node->height = lHeight+1;
    else
        node->height = rHeight+1;

    lHeight = getHeight(rightChild->lchild), rHeight = getHeight(rightChild->rchild);
    if ( lHeight > rHeight )
        rightChild->height = lHeight+1;
    else
        rightChild->height = rHeight+1;

    return rightChild;
}


int AVLTree ::balanceFactor(nodeType* cur) {
    int right = getHeight(cur->rchild), left = getHeight(cur->lchild);
    return  left - right;
}

int AVLTree :: getHeight ( nodeType* node ) {
    if ( node == NULL )
        return 0;
    else
        return node->height;
}

void AVLTree ::AVLShow(  ) {
    cout << "Tree height = " << root->height;
    cout << endl << "Number of nodes = " << countNode(root);

    for ( int i = 0; i < root->key.size(); i++ ) {
        cout << endl << i+1 << ": " << "[" << root->key[i].num << "] " << root->key[i].sname << ", " ;
        cout << root->key[i].dname << ", " << root->key[i].type << ", " << root->key[i].level;
        cout << ", " << root->key[i].nstud << ", " << root->key[i].ngrad ;
    }

    cout << endl <<endl;
}

int AVLTree ::countNode( nodeType* cur ) {
    if ( cur == NULL )
        return 0;

    return countNode(cur->rchild) + countNode(cur->lchild) + 1;
}

void AVLTree :: clearNode(nodeType* node) {
    if (node == NULL ) {
        return; // Base case: node is null
    }

    clearNode(node->lchild); // Delete left subtree
    clearNode(node->rchild); // Delete right subtree

    delete node; // Delete the current node
}




// schoolList-------------------------------------------------------------------------
void schoolList ::printTopK23( int num) {
    vector<int> top;
    int j = 0;
    if( num > allR.size() ) {
    	
	}
    else if ( num < 0 ) {
    	
	}
    else {
    	the23Tree.printTop( num, the23Tree.getRoot(), top );
	    int count = 1;
	    
	    	for( int i = 0; i < top.size(); i++ ){
		        for ( int j = 0; j < allR.size(); j++ ) {
		            if ( top[i] == allR[j].ngrad && count <= num) {
		                cout  << count << ": " << "[" << allR[j].num << "] " << allR[j].sname << ", " ;
		                cout << allR[j].dname << ", " << allR[j].type << ", " << allR[j].level;
		                cout << ", " << allR[j].nstud << ", " << allR[j].ngrad << endl;
		                count++;
		            }
		        }
		    }
		
		    
	
	}
    
}
void schoolList::printTopK(int numK) {
    int j = 1;
    
    if( numK > allR.size() ) {
    	
	}
    else if ( numK < 0 ) {
    	
	}
	else theAVLTree.AVLPrintTop(numK, theAVLTree.getRoot(), j );
}

bool schoolList ::AVLIsEmpty() {
    return theAVLTree.isEmpty();
}

void schoolList ::clearAVL() {
    theAVLTree.clearUp();
}

void schoolList ::showAVL( ) {
    theAVLTree.AVLShow(  );
}

void schoolList ::insertAVL() {
    for ( int i = 0; i < allR.size(); i++ ) {
        theAVLTree.setRoot(theAVLTree.intsertAVL( theAVLTree.getRoot(), allR[i]));
    }
}

//void schoolList ::clear23tree() {
//    the23Tree.clearUp();
//}
void schoolList ::show23() {

    vector<int> root_items = the23Tree.show();
	int index = 0 ;
    for (int j = 0; j < root_items.size(); j++) {
        for (int i = 0; i < allR.size(); i++) {
            if (allR[i].ngrad == root_items[j] ) {
                cout << endl << index+1 << ": " << "[" << allR[i].num << "] " << allR[i].sname << ", " ;
                cout << allR[i].dname << ", " << allR[i].type << ", " << allR[i].level;
                cout << ", " << allR[i].nstud << ", " << allR[i].ngrad;
                index++;
            }
        }

    }
    cout << endl<< endl ;
}
void schoolList ::clear23() {
    the23Tree.clearUp();
}
void schoolList ::insert23() {
    vector<schooltype> allR_only;

    for (int i = 0; i < allR.size(); i++) {
        bool found = false;

        // 檢查是否已經存在具有相同 ngrad 值的元素
        for (int j = 0; j < allR_only.size(); j++) {
            if (allR[i].ngrad == allR_only[j].ngrad) {
                found = true;
                break;
            }
        }

        // 如果沒有找到相同的 ngrad，則將元素添加到 allR_only 中
        if (!found) {
            //cout << allR[i].ngrad << endl ;
            allR_only.push_back(allR[i]);
        }


    }

    for( int i = 0 ; i < allR_only.size() ; i++  ) {
        // 將元素插入 2-3 樹
        the23Tree.treeInsert(allR_only[i].ngrad);
    }

}


bool schoolList :: isEmpty() {
    if (  allR.size() == 0)
        return true;
    else
        return false;
}

void schoolList :: readF( string fileName ) {          // definition: read all from a file
    int count = 0;

    fstream inFile;                 // file handle

    string fileID = fileName;
    fileName = "input" + fileID + ".txt";
    inFile.open(fileName.c_str(), fstream::in); // open file to read

    while (!inFile.is_open()) {                              // unable to open file
        cout << endl << "### " << fileName << " does not exist! ###" << endl;
        cout << endl << "Input a file number ([0] Quit): ";
        cin >> fileName;
        fileID = fileName;
        fileName = "input" + fileID + ".txt";
        inFile.open(fileName.c_str(), fstream::in); // open file to read

    } // while

    bool jump = false ;
    char cstr[255];
    int fNo = 0, pre = 0, pos = 0 ;
    inFile.getline(cstr, 255, '\n');     // skip the 1st header line
    inFile.getline(cstr, 255, '\n');     // skip the 2nd header line
    inFile.getline(cstr, 255, '\n');     // skip the list of column names
    int num = 0;
    while ( inFile.getline(cstr, 255, '\n') ) {  // get all records
        schooltype oneR;
        string buf, cut;
        fNo = 0;
        pre = 0;
        buf.assign(cstr);

        do {
            pos = buf.find_first_of('\t', pre);
            cut = buf.substr(pre, pos - pre);
            switch (++fNo) {
                case 2: oneR.sname = cut;               // college name
                    break;
                case 4: oneR.dname = cut;               // department name
                    break;
                case 5: oneR.type = cut;                // either day or night
                    break;
                case 6: oneR.level = cut;               // graduate or undergraduate
                    break;
                case 7:
                    while (count < cut.size()) {
                        if (cut[count] > '9' || cut[count] < '0')
                            cut.erase(count, 1);

                        count++;
                    } // while
                    count = 0;
                    oneR.nstud = atoi(cut.c_str());
                    break;
                case 9:
                    while ( count < cut.size() ) {
                        if ( cut[count] > '9' || cut[count] < '0' ) {
                            cut.erase(count, 1);
                        }
                        count++;
                    }
                    count = 0;
                    oneR.ngrad = atoi(cut.c_str()); // get the number of graduates
                    // cout << endl << oneR.ngrad;
                    break;
                default:
                    break; //end switch
            }

            pre = ++pos;
        } while ((pos > 0) && (fNo < 9));

        num++;
        oneR.num = num;
        allR.push_back(oneR);
        fNo = 1;

        oneR.ngrad = 0;
        oneR.num = 0;
        oneR.nstud = 0 ;

    }

} // end readFile

